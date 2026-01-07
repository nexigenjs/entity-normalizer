import { makeObservable, observable, action, runInAction } from 'mobx';

import { CanceledError, isCanceled } from './cancel';
import { executionAsyncContext } from './execution-context';
import { DUCK_TAG } from './marker';
import { defaultRetryStrategy } from './retry';

import type { RunOptions, RetryStrategy } from './types';

export class AsyncDuck<TParams, TResult> {
  private _isLoading = false;
  private _isRetrying = false;
  private _error: Error | null = null;
  private _data: TResult | null = null;
  private _hasEverRun = false;

  private _inFlight = false;
  private _lastSuccessParams?: TParams;
  private _lastRunSucceeded = false;

  private fn: (params?: TParams) => Promise<TResult>;
  private _keyed = new Map<string, AsyncDuck<TParams, TResult>>();
  private _proxy?: Readonly<this & Record<string, AsyncDuck<TParams, TResult>>>;

  private _lastRunParams?: TParams;
  private _abortController: AbortController | null = null;

  private _tokenCounter = 0;
  private _activeToken = 0;

  constructor(fn: (params?: TParams) => Promise<TResult>) {
    this.fn = fn;

    this._proxy = new Proxy(this, {
      get: (target, prop: string) => {
        if (prop in target) {
          return (target as any)[prop];
        }
        return target.getKeyed(prop);
      },
    }) as Readonly<this & Record<string, AsyncDuck<TParams, TResult>>>;

    Object.defineProperty(this._proxy, DUCK_TAG, {
      value: true,
      enumerable: false,
      writable: false,
    });

    makeObservable(this as any, {
      _isLoading: observable,
      _isRetrying: observable,
      _error: observable,
      _data: observable,
      _hasEverRun: observable,

      setLoading: action,
      setSuccess: action,
      setError: action,
      reset: action,
      cancel: action,
    });
  }

  // -------------------------------------
  // KEYED INSTANCES
  // -------------------------------------
  getKeyed(key: string) {
    if (!this._keyed.has(key)) {
      const duck = new AsyncDuck<TParams, TResult>(this.fn);
      this._keyed.set(key, duck);
    }
    return this._keyed.get(key)!;
  }

  // -------------------------------------
  // INTERNAL MUTATORS
  // -------------------------------------
  private setLoading(isRetry = false) {
    this._isLoading = !isRetry;
    this._isRetrying = isRetry;
    this._error = null;
  }

  private setSuccess(data: TResult, onSuccess?: (d: TResult) => void) {
    this._data = data;
    this._isLoading = false;
    this._isRetrying = false;

    this._hasEverRun = true;
    this._lastRunSucceeded = true;
    this._lastSuccessParams = this._lastRunParams;

    onSuccess?.(data);
  }

  private setError(err: unknown, onError?: (e: Error) => void) {
    const normalized = err instanceof Error ? err : new Error(String(err));

    this._error = normalized;
    this._isLoading = false;
    this._isRetrying = false;
    this._hasEverRun = true;

    this._lastRunSucceeded = false;
    onError?.(normalized);
  }

  private abortAndInvalidate() {
    if (this._abortController && (this._isLoading || this._isRetrying)) {
      this._abortController.abort();
    }
    this._abortController = null;

    this._activeToken = ++this._tokenCounter;
  }

  reset() {
    this.cancel();
    this._error = null;
    this._data = null;
    this._hasEverRun = false;
    this._lastSuccessParams = undefined;
    this._lastRunParams = undefined;
  }

  cancel() {
    this.abortAndInvalidate();

    this.setLoading(false);
  }

  // -------------------------------------
  // UTILS
  // -------------------------------------
  private sleep(ms: number, signal?: AbortSignal | null) {
    return new Promise<void>((resolve, reject) => {
      if (!signal) {
        setTimeout(resolve, ms);
        return;
      }

      if (signal.aborted) {
        reject(new CanceledError());
        return;
      }

      let timer: ReturnType<typeof setTimeout> | null = null;

      const onAbort = () => {
        if (timer) {
          clearTimeout(timer);
        }
        reject(new CanceledError());
      };

      timer = setTimeout(() => {
        signal.removeEventListener('abort', onAbort);
        resolve();
      }, ms);

      signal.addEventListener('abort', onAbort, { once: true });
    });
  }

  // -------------------------------------
  // RETRY ENGINE
  // -------------------------------------
  private async runWithRetry(
    params: TParams | undefined,
    retryStrategy: RetryStrategy,
    signal: AbortSignal | null,
  ): Promise<TResult> {
    const retry = { ...defaultRetryStrategy, ...retryStrategy };
    const max = retry.retries ?? 0;

    for (let attempt = 1; attempt <= max + 1; attempt++) {
      if (signal?.aborted) {
        throw new CanceledError();
      }

      try {
        return await this.fn(params);
      } catch (error: unknown) {
        if (isCanceled(error, signal)) {
          throw new CanceledError();
        }

        const normalized =
          error instanceof Error ? error : new Error(String(error));

        const should = retry.shouldRetry?.(normalized) ?? false;
        const isLast = attempt > max;

        if (!should || isLast) {
          throw normalized;
        }

        runInAction(() => {
          this._isRetrying = true;
        });

        const baseDelay = retry.delayMs ?? 0;
        const delay = retry.backoff ? baseDelay * attempt : baseDelay;

        if (delay > 0) {
          await this.sleep(delay, signal);
        }
      }
    }

    throw new Error('Unexpected retry exit');
  }

  // -------------------------------------
  // PUBLIC RUN
  // -------------------------------------
  async run(
    options?: RunOptions<TParams, TResult>,
  ): Promise<TResult | undefined> {
    if (options?.skip || this._inFlight) {
      return undefined;
    }

    this._inFlight = true;

    if (options?.key) {
      return this.getKeyed(options.key).run({
        ...options,
        key: undefined,
      });
    }

    const token = this._activeToken;

    const controller = new AbortController();
    this._abortController = controller;

    const { params, onSuccess, onError, retryStrategy } = options ?? {};
    this._lastRunParams = params;

    this.setLoading(!!retryStrategy);

    return executionAsyncContext.withAbort(controller.signal, async () => {
      try {
        const signal = executionAsyncContext.currentSignal();

        const result = retryStrategy
          ? await this.runWithRetry(params, retryStrategy, signal)
          : await this.fn(params);

        if (this._activeToken !== token) {
          return undefined;
        }
        if (controller.signal.aborted) {
          return undefined;
        }

        this.setSuccess(result, onSuccess);
        return result;
      } catch (err) {
        if (this._activeToken !== token) {
          return undefined;
        }

        if (isCanceled(err, controller.signal)) {
          this._isLoading = false;
          this._isRetrying = false;
          return undefined;
        }

        this.setError(err, onError);
        return undefined;
      } finally {
        this._inFlight = false;
      }
    });
  }

  refresh(): Promise<TResult | undefined> {
    if (!this._lastRunSucceeded) {
      return Promise.resolve(undefined);
    }

    this._inFlight = false;
    this.abortAndInvalidate();

    return executionAsyncContext.withIntent('refresh', () =>
      this.run({ params: this._lastSuccessParams }),
    );
  }

  // -------------------------------------
  // GETTERS
  // -------------------------------------
  get isLoading() {
    return this._isLoading;
  }
  get isInFlight() {
    return this._inFlight;
  }
  get isRetrying() {
    return this._isRetrying;
  }
  get isError() {
    return !!this._error;
  }
  get isSuccess() {
    return !this._isLoading && !this._error && this._data !== null;
  }
  get data() {
    return this._data;
  }
  get error() {
    return this._error;
  }
  get hasEverRun() {
    return this._hasEverRun;
  }

  get asyncState() {
    return {
      isLoading: this._isLoading,
      isRetrying: this._isRetrying,
      error: this._error,
      data: this._data,
      hasEverRun: this._hasEverRun,
      isError: this.isError,
      isSuccess: this.isSuccess,
    };
  }

  get proxy() {
    return this._proxy;
  }
}
