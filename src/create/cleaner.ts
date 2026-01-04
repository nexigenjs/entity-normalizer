import { runInAction } from 'mobx';

import { incSuppress, decSuppress } from './utils';

import type { StoreShape } from './scanner';
import type { SystemDeps } from '../root/types';

/**
 * Cleaner
 *
 * - resetStore is a **silent, infra-only operation**
 * - MUST NOT trigger persistence notifications
 * - persistence lifecycle is handled by StoreProxy / higher-level APIs
 */
export class Cleaner {
  constructor(private deps: SystemDeps) {}

  applyReset(
    store: any,
    shape: Pick<StoreShape, 'plain' | 'single' | 'multi' | 'records'>,
  ) {
    const initialPlain = shape.plain;

    // already patched
    if (typeof store.resetStore === 'function') {
      return;
    }

    Object.defineProperty(store, 'resetStore', {
      enumerable: false,
      configurable: true,
      writable: true,
      value: () => {
        incSuppress(store);

        try {
          runInAction(() => {
            // -------------------------
            // plain fields
            // -------------------------
            for (const [key, val] of Object.entries(initialPlain)) {
              try {
                store[key] = val;
              } catch {}
            }

            // -------------------------
            // single collections
            // -------------------------
            for (const key of shape.single) {
              try {
                store[key]?.reset?.();
              } catch {}
            }

            // -------------------------
            // multi collections
            // -------------------------
            for (const key of shape.multi) {
              const mc = store[key];
              try {
                if (mc?.resetAll) {
                  mc.resetAll();
                } else if (mc?.getSubCollections) {
                  for (const col of mc.getSubCollections().values()) {
                    col.reset?.({ silent: true });
                  }
                }
              } catch {}
            }

            // -------------------------
            // records
            // -------------------------
            for (const key of shape.records) {
              try {
                store[key]?.reset?.();
              } catch {}
            }
          });
        } finally {
          decSuppress(store);
        }
      },
    });
  }
}
