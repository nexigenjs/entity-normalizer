import { runInAction } from 'mobx';

import { SUPPRESS_KEY } from './constants';

import type { SystemDeps } from '../root/types';

export class StoreProxy {
  private notifyQueued = false;
  private pendingNotify = false;
  private wrapped = new Map<string, Function>();

  constructor(
    private deps: SystemDeps,
    private target: any,
    private actions: string[],
  ) {}

  build() {
    return new Proxy(this.target, {
      get: (target, prop, receiver) => {
        const value = Reflect.get(target, prop, receiver);

        if (!this.actions.includes(prop as string)) {
          return value;
        }

        // allow duck/collection objects to pass-through (no wrapping)
        if (value && typeof value === 'object') {
          return value;
        }

        if (typeof value === 'function') {
          const key = String(prop);
          const cached = this.wrapped.get(key);
          if (cached) {
            return cached;
          }

          const wrapped = this.wrapAction(target, value);
          this.wrapped.set(key, wrapped);
          return wrapped;
        }

        return value;
      },

      set: (target, prop, val, receiver) => {
        const result = Reflect.set(target, prop, val, receiver);

        if (
          typeof prop === 'string' &&
          (prop.startsWith('__') || prop === SUPPRESS_KEY)
        ) {
          return result;
        }

        this.scheduleNotify(target);
        return result;
      },
    });
  }

  private scheduleNotify(target: any) {
    if ((target?.[SUPPRESS_KEY] ?? 0) > 0) {
      this.pendingNotify = true;
      if (!this.notifyQueued) {
        this.notifyQueued = true;
        queueMicrotask(() => {
          this.notifyQueued = false;
          if ((target?.[SUPPRESS_KEY] ?? 0) === 0 && this.pendingNotify) {
            this.pendingNotify = false;
            this.deps.getPersistence?.()?.onStoreStateChanged?.();
          }
        });
      }
      return;
    }

    if (this.notifyQueued) {
      return;
    }
    this.notifyQueued = true;
    queueMicrotask(() => {
      this.notifyQueued = false;
      this.deps.getPersistence?.()?.onStoreStateChanged?.();
    });
  }

  private wrapAction(target: any, fn: Function) {
    return (...args: any[]) => {
      let result: any;

      try {
        result = runInAction(() => fn.apply(target, args));
      } finally {
        if (!(result instanceof Promise)) {
          this.scheduleNotify(target);
        }
      }

      if (result instanceof Promise) {
        return result.finally(() => this.scheduleNotify(target));
      }

      return result;
    };
  }
}
