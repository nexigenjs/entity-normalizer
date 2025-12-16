import { rootStore } from './index';
import { createStoreHooks } from '@nexigen/entity-normalizer';

export const { useStores, useServices, useStore, useService, useCore } =
  createStoreHooks<typeof rootStore>();
