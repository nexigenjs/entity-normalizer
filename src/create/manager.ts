import { Cleaner } from './cleaner';
import { StoreSnapshotExtractor } from './extractor';
import { StoreProxy } from './proxy';
import { Scanner, type StoreShape } from './scanner';
import { defineHiddenProp, incSuppress, decSuppress } from './utils';

import type { StoreDepsCombined, DomainDeps } from '../root/types';

export class StoreManager {
  private scanner = new Scanner();
  private cleaner: Cleaner;
  private extractor: StoreSnapshotExtractor;

  constructor(private deps: StoreDepsCombined) {
    this.cleaner = new Cleaner(deps.system);
    this.extractor = new StoreSnapshotExtractor();
  }

  create<TStore>(StoreClass: new (deps: DomainDeps) => TStore): TStore {
    const instance = new StoreClass(this.deps.domain);
    const shape: StoreShape = this.scanner.scan(instance);

    // reset
    this.cleaner.applyReset(instance, shape);

    // snapshot API (hidden)
    defineHiddenProp(instance as any, '__getSnapshot', () =>
      this.extractor.getSnapshot(instance, shape),
    );

    defineHiddenProp(instance as any, '__applySnapshot', (snap: any) => {
      // suppress persist spam while mutating many fields
      incSuppress(instance);
      try {
        this.extractor.applySnapshot(instance, snap, shape);
      } finally {
        decSuppress(instance);
      }

      // one notify after restore
      queueMicrotask(() =>
        this.deps.system?.getPersistence?.()?.onStoreStateChanged?.(),
      );
    });

    // proxy for action wrapping + coalesced notify
    return new StoreProxy(
      this.deps.system,
      instance,
      shape.actions,
    ).build() as TStore;
  }
}
