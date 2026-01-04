import { createEntitiesAPI } from './entities';
import { createLifecycleAPI } from './lifecycle';
import { createStoresAPI } from './stores';

import type {
  CoreAPI,
  CoreEntitiesDeps,
  CoreLifecycleDeps,
  CoreStoresDeps,
  CoreInternalAPI,
} from './types';

export function createCoreAPI<TStores extends Record<string, any>>(deps: {
  lifecycle: CoreLifecycleDeps;
  entities: CoreEntitiesDeps;
  stores: CoreStoresDeps<TStores>;
  use<T>(key: PropertyKey): T | undefined;
  __internal: CoreInternalAPI;
}): CoreAPI<TStores> {
  return {
    lifecycle: createLifecycleAPI(deps.lifecycle),
    entities: createEntitiesAPI(deps.entities),
    stores: createStoresAPI(deps.stores),
    use: deps.use,
    __internal: deps.__internal,
  } as unknown as CoreAPI<TStores>;
}
