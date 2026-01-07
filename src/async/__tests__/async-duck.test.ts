// @ts-nocheck
import { AsyncDuck } from '../async-duck';
import { executionAsyncContext } from '../execution-context';
import { DUCK_TAG } from '../marker';

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (v: T) => void;
  reject: (e: unknown) => void;
};

function deferred<T>(): Deferred<T> {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function abortError() {
  const e = new Error('canceled');
  (e as any).name = 'AbortError';
  return e;
}

async function flushMicrotasks(times = 3) {
  for (let i = 0; i < times; i++) {
    await Promise.resolve();
  }
  await new Promise(res => setTimeout(res, 0));
}

function createFakeApi() {
  let id = 0;
  const calls: Array<{ id: number; aborted: boolean }> = [];

  async function fetch(signal?: AbortSignal): Promise<number> {
    const callId = ++id;

    calls.push({ id: callId, aborted: false });

    signal?.addEventListener('abort', () => {
      const call = calls.find(c => c.id === callId);
      if (call) {
        call.aborted = true;
      }
    });

    await new Promise((resolve, reject) =>
      setTimeout(() => {
        if (signal?.aborted) {
          reject(new Error('canceled'));
        } else {
          resolve(null);
        }
      }, 10),
    );

    return callId;
  }

  return {
    fetch,
    calls,
  };
}

// helper to flush microtasks
const flush = () => new Promise(res => setTimeout(res, 0));

describe('AsyncDuck', () => {
  describe('AsyncDuck (basic)', () => {
    test('run() success updates state correctly', async () => {
      const duck = new AsyncDuck(async (p: number) => p + 1);

      const result = await duck.run({ params: 5 });

      expect(result).toBe(6);
      expect(duck.isLoading).toBe(false);
      expect(duck.isError).toBe(false);
      expect(duck.isSuccess).toBe(true);
      expect(duck.data).toBe(6);
      expect(duck.hasEverRun).toBe(true);
    });

    test('run() error updates error state', async () => {
      const duck = new AsyncDuck(async () => {
        throw new Error('fail');
      });

      await duck.run();

      expect(duck.isError).toBe(true);
      expect(duck.error?.message).toBe('fail');
      expect(duck.isSuccess).toBe(false);
    });

    test('onSuccess and onError callbacks fire correctly', async () => {
      const onSuccess = jest.fn();
      const onError = jest.fn();

      const duck = new AsyncDuck(async (n: number) => n * 2);

      await duck.run({ params: 3, onSuccess });

      expect(onSuccess).toHaveBeenCalledWith(6);
      expect(onError).not.toHaveBeenCalled();

      // now error
      const duck2 = new AsyncDuck(async () => {
        throw new Error('err');
      });

      await duck2.run({ onError });

      expect(onError).toHaveBeenCalled();
    });

    test('skip option prevents execution', async () => {
      const fn = jest.fn(async () => 123);
      const duck = new AsyncDuck(fn);

      const result = await duck.run({ skip: true });

      expect(result).toBeUndefined();
      expect(fn).not.toHaveBeenCalled();
      expect(duck.hasEverRun).toBe(false);
    });

    test('keyed ducks: duck.proxy.someKey creates unique instance', async () => {
      const duck = new AsyncDuck(async (n: number) => n + 1);

      const keyedA = duck.proxy.one;
      const keyedB = duck.proxy.two;

      expect(keyedA).not.toBe(keyedB);
      expect(keyedA[DUCK_TAG]).toBe(true);

      await keyedA.run({ params: 1 });
      await keyedB.run({ params: 10 });

      expect(keyedA.data).toBe(2);
      expect(keyedB.data).toBe(11);
    });

    test('run() with retryStrategy retries the expected number of times', async () => {
      let attempt = 0;
      void attempt;

      const fn = jest.fn(async () => {
        attempt++;
        throw new Error('fail');
      });

      const duck = new AsyncDuck(fn);

      await duck.run({
        retryStrategy: {
          retries: 2,
          shouldRetry: () => true,
          delayMs: 1,
        },
      });

      // 1 initial try + 2 retries = 3 calls
      expect(fn).toHaveBeenCalledTimes(3);
      expect(duck.isError).toBe(true);
    });

    test('runWithRetry stops retrying when shouldRetry returns false', async () => {
      let attempt = 0;
      void attempt;

      const fn = jest.fn(async () => {
        attempt++;
        throw new Error('x');
      });

      const duck = new AsyncDuck(fn);

      await duck.run({
        retryStrategy: {
          retries: 5,
          shouldRetry: () => false,
        },
      });

      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('onSuccess inside retryStrategy still triggers correctly', async () => {
      const fn = jest.fn(async () => 100);
      const onSuccess = jest.fn();

      const duck = new AsyncDuck(fn);

      await duck.run({
        retryStrategy: { retries: 2, shouldRetry: () => true, delayMs: 1 },
        onSuccess,
      });

      expect(onSuccess).toHaveBeenCalledWith(100);
      expect(duck.data).toBe(100);
    });

    test('reset() clears all internal state', async () => {
      const duck = new AsyncDuck(async () => 99);

      await duck.run();
      duck.reset();

      expect(duck.data).toBeNull();
      expect(duck.isRetrying).toBe(false);
      expect(duck.isError).toBe(false);
      expect(duck.isInFlight).toBe(false);
      expect(duck.hasEverRun).toBe(false);
    });

    test('asyncState getter returns full state snapshot', async () => {
      const duck = new AsyncDuck(async n => n + 1);

      await duck.run({ params: 5 });

      expect(duck.asyncState).toEqual({
        isLoading: false,
        isRetrying: false,
        error: null,
        data: 6,
        hasEverRun: true,
        isError: false,
        isSuccess: true,
      });
    });

    test('proxy exposes keyed ducks and preserves DUCK_TAG', () => {
      const duck = new AsyncDuck(async () => 1);

      expect(duck.proxy[DUCK_TAG]).toBe(true);
      expect(duck.proxy.randomKey).toBeInstanceOf(AsyncDuck);
    });
  });

  describe('AsyncDuck + ExecutionContext (integration)', () => {
    test('refresh intent is visible inside execution', async () => {
      const duck = new AsyncDuck(async () =>
        executionAsyncContext.is('refresh') ? 'refresh' : 'normal',
      );

      const a = await duck.run();
      expect(a).toBe('normal');

      const b = await duck.refresh();
      expect(b).toBe('refresh');
    });

    test('refresh aborts previous refresh or run', async () => {
      const api = createFakeApi();

      const duck = new AsyncDuck(() =>
        api.fetch(executionAsyncContext.currentSignal()!),
      );

      await duck.run(); // initial success

      const r1 = duck.refresh();
      const r2 = duck.refresh();

      await flush();

      await expect(r1).resolves.toBeUndefined();
      await expect(r2).resolves.toBe(3);

      expect(api.calls[1].aborted).toBe(true);
    });
    test('cancel aborts request but does not set error', async () => {
      const api = createFakeApi({ delay: 50 });

      const duck = new AsyncDuck(() =>
        api.fetch(executionAsyncContext.currentSignal()!),
      );

      const promise = duck.run();

      await flushMicrotasks();
      duck.cancel();

      await promise;
      await flush();

      expect(duck.isError).toBe(false);
      expect(duck.error).toBeNull();
      expect(duck.isInFlight).toBe(false);
    });
    test('retry loop stops immediately after abort', async () => {
      const api = createFakeApi();

      const duck = new AsyncDuck(() =>
        api.fetch(executionAsyncContext.currentSignal()!),
      );

      const p = duck.run({
        retryStrategy: {
          retries: 5,
          shouldRetry: () => true,
          delayMs: 1,
        },
      });

      duck.cancel();

      await flush();

      await expect(p).resolves.toBeUndefined();

      expect(api.calls.length).toBe(1);
      expect(api.calls[0].aborted).toBe(true);
    });

    test('keyed ducks have isolated abort scopes', async () => {
      const api = createFakeApi();

      const duck = new AsyncDuck(() =>
        api.fetch(executionAsyncContext.currentSignal()!),
      );

      const a = duck.proxy.a;
      const b = duck.proxy.b;

      const p1 = a.run();
      const p2 = b.run();

      a.cancel();

      await flush();

      await expect(p1).resolves.toBeUndefined();
      await expect(p2).resolves.toBe(2);

      expect(api.calls.length).toBe(2);
      expect(api.calls[0].aborted).toBe(true);
      expect(api.calls[1].aborted).toBe(false);
    });

    test('nested execution contexts keep correct signal', async () => {
      const api = createFakeApi();

      const duck = new AsyncDuck(() =>
        api.fetch(executionAsyncContext.currentSignal()!),
      );

      const result = await executionAsyncContext.withIntent('refresh', () =>
        duck.run(),
      );

      expect(result).toBe(1);
      expect(api.calls.length).toBe(1);
      expect(api.calls[0].aborted).toBe(false);
    });
  });

  describe('AsyncDuck - latest wins + cancellation semantics', () => {
    test('cancel must NOT set error even if underlying rejects with AbortError', async () => {
      const d = deferred<string>();
      const fn = jest.fn(() => d.promise);

      const duck = new AsyncDuck<void, string>(fn);

      const p = duck.run();
      await flushMicrotasks();
      duck.cancel();

      d.reject(abortError());
      await p;
      await flush();

      expect(duck.isError).toBe(false);
      expect(duck.error).toBeNull();
      expect(duck.isInFlight).toBe(false);
    });

    test('cancel during retry backoff must stop further attempts', async () => {
      const netErr = Object.assign(new Error('net'), { code: 'ERR_NETWORK' });

      const fn = jest
        .fn()
        .mockRejectedValueOnce(netErr)
        .mockResolvedValueOnce('ok');

      const duck = new AsyncDuck<void, string>(fn);

      const p = duck.run({
        retryStrategy: {
          retries: 5,
          delayMs: 50,
          shouldRetry: () => true,
        },
      });

      await flushMicrotasks(10);
      duck.cancel();

      await expect(p).resolves.toBeUndefined();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('refresh uses lastSuccessParams of last successful run', async () => {
      const fn = jest
        .fn()
        .mockResolvedValueOnce('ok1') // P1 success
        .mockResolvedValueOnce('ok2') // P2 success
        .mockResolvedValueOnce('ok_refresh'); // refresh should call with P2 (last success)

      const duck = new AsyncDuck<string, string>(fn);

      await duck.run({ params: 'P1' });
      await duck.run({ params: 'P2' });

      await duck.refresh();

      expect(fn.mock.calls.map(c => c[0])).toEqual(['P1', 'P2', 'P2']);
    });

    test('CONTRACT: refresh allowed only if LAST run succeeded (should fail with current impl)', async () => {
      const fn = jest
        .fn()
        .mockResolvedValueOnce('ok') // success
        .mockRejectedValueOnce(new Error('fail')); // last run failed

      const duck = new AsyncDuck<void, string>(fn);

      await duck.run();
      await duck.run(); // fail

      const res = await duck.refresh();

      // Contract says: refresh only allowed after last successful run => should be undefined and NOT call fn again
      expect(res).toBeUndefined();
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});
