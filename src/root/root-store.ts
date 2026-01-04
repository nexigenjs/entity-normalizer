import { makeObservable, computed, action } from 'mobx';

import { createStore } from '../create';
import { EntityCleanerStore } from '../entities/cleaner';
import {
  COLLECTION_TAG,
  MULTI_COLLECTION_TAG,
} from '../entities/collection/marker';
import { RECORD_TAG } from '../entities/record/marker';
import { EntitiesStore } from '../entities/store';
import { createCoreAPI } from './coreApi/create-core-api';
import { noopPersistence } from './fallback';
import { SET_PERSISTENCE } from './marker';

import type { CoreAPI } from './coreApi/types';
import type {
  RootStoreDeps,
  SystemDeps,
  StoreDepsCombined,
  StoreClassMap,
  ServiceClassMap,
  PersistenceNotifier,
  DomainDeps,
} from './types';
import type { AnySchema, TEntitiesStore } from '../entities/types';

export class RootStore<
  TApi,
  TSchemaMap extends Record<string, AnySchema>,
  TStores extends StoreClassMap<any, any>,
  TServices extends ServiceClassMap<any, any>,
> {
  public core!: CoreAPI<{
    [K in keyof TStores]: InstanceType<TStores[K]>;
  }>;

  private entities!: TEntitiesStore;
  private entitiesCleaner!: EntityCleanerStore;
  private persistence?: PersistenceNotifier;

  [SET_PERSISTENCE](notifier: PersistenceNotifier) {
    this.persistence = notifier;
  }

  public stores!: { [K in keyof TStores]: InstanceType<TStores[K]> };
  public services!: { [K in keyof TServices]: InstanceType<TServices[K]> };

  private _isInitialized = false;

  private storesRef!: {
    [K in keyof TStores]: InstanceType<TStores[K]>;
  };

  private _domainDeps?: DomainDeps;
  private _systemDeps?: SystemDeps;
  private _combinedDeps?: StoreDepsCombined;

  private _decorators?: {
    isRecord: (v: any) => boolean;
    isCollection: (v: any) => boolean;
    isMultiCollection: (v: any) => boolean;
  };

  constructor(
    private deps: RootStoreDeps<TApi, TSchemaMap, TStores, TServices>,
  ) {
    this.initEntities();

    this.initStoresRef();

    this.core = this.createCore(this.storesRef);
    this.buildStores(this.combinedDeps);
    this.attachStoresToCore(this.storesRef);
    this.buildServices(this.domainDeps);
    this.setupPlugins();
    this.hidePrivateProperties();

    makeObservable(this, {
      isInitialized: computed,
      setInitialized: action,
      // NOTE:
      // `isInitialized` is intentionally private.
      // We use `as any` here to keep lifecycle accessible ONLY via Core API.
      // Do NOT access RootStore lifecycle directly.
    } as any);
  }

  private get isInitialized() {
    return this._isInitialized;
  }

  private setInitialized(v: boolean) {
    this._isInitialized = v;
  }

  private get decorators() {
    if (!this._decorators) {
      this._decorators = {
        isRecord: (v: any) => v?.[RECORD_TAG] === true,
        isCollection: (v: any) => v?.[COLLECTION_TAG] === true,
        isMultiCollection: (v: any) => v?.[MULTI_COLLECTION_TAG] === true,
      };
    }

    return this._decorators;
  }

  private initStoresRef() {
    this.storesRef = {} as {
      [K in keyof TStores]: InstanceType<TStores[K]>;
    };
  }

  private get domainDeps() {
    if (!this._domainDeps) {
      const self = this;
      this._domainDeps = {
        api: this.deps.api,
        get stores() {
          return self.stores;
        },
        get services() {
          return self.services;
        },
        core: this.core,
      };
    }
    return this._domainDeps;
  }

  private get systemDeps(): SystemDeps {
    if (!this._systemDeps) {
      this._systemDeps = {
        getPersistence: () => this.persistence ?? noopPersistence,
        entities: this.entities,
      };
    }
    return this._systemDeps;
  }

  private get combinedDeps(): StoreDepsCombined {
    if (!this._combinedDeps) {
      this._combinedDeps = {
        domain: this.domainDeps,
        system: this.systemDeps,
      };
    }
    return this._combinedDeps;
  }

  private initEntities() {
    this.entities = new EntitiesStore() as TEntitiesStore;
    this.entitiesCleaner = new EntityCleanerStore(
      this.entities,
      this.deps.schemaMap,
    );
  }

  private createCore(storesRef: any) {
    const self = this;

    const extensions = Object.create(null);

    return createCoreAPI({
      lifecycle: {
        getIsInitialized: () => self.isInitialized,
        setInitialized: (v: boolean) => self.setInitialized(v),
      },
      entities: {
        entities: this.entities,
        entitiesCleaner: this.entitiesCleaner,
        schemaMap: this.deps.schemaMap,
        getPersistence: () => this.persistence ?? noopPersistence,
      },
      use<T>(key: PropertyKey): T | undefined {
        return extensions[key] as T | undefined;
      },
      stores: storesRef,
      __internal: {
        setPersistence: notifier => {
          this[SET_PERSISTENCE](notifier);
        },
        registerExtension(key: PropertyKey, api: unknown) {
          extensions[key] = api;
        },
      },
    });
  }

  private setupPlugins() {
    for (const plugin of this.deps.plugins ?? []) {
      plugin.setup({
        entities: this.entities,
        core: this.core,
        config: plugin.config,
        stores: this.stores,
        services: this.services,
        decorators: this.decorators,
      });
    }
  }

  private buildStores(combinedDeps: StoreDepsCombined) {
    this.stores = Object.fromEntries(
      Object.entries(this.deps.stores).map(([key, StoreClass]) => {
        const instance = createStore(StoreClass as any, combinedDeps);
        return [key, instance];
      }),
    ) as { [K in keyof TStores]: InstanceType<TStores[K]> };
  }

  private attachStoresToCore(storesRef: any) {
    Object.assign(storesRef, this.stores);
  }

  private buildServices(domainDeps: DomainDeps) {
    this.services = Object.fromEntries(
      Object.entries(this.deps.services).map(([key, ServiceClass]) => {
        const instance = new ServiceClass(domainDeps);

        return [key, instance];
      }),
    ) as { [K in keyof TServices]: InstanceType<TServices[K]> };
  }

  private hidePrivateProperties() {
    Object.defineProperty(this.core, '__internal', {
      enumerable: false,
    });
  }
}
