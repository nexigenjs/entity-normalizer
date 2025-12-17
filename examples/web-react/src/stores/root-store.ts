import { createRootStore } from '@nexigen/entity-normalizer';

import { Api } from '../api';
import { CommentsStore } from './comments/store';
import { PostsStore } from './posts/store';
import { schemaMap } from './schema-map';
import { ViewerStore } from './viewer/store';

export const rootStore = createRootStore({
  api: Api,
  schemaMap,
  stores: {
    viewer: ViewerStore,
    posts: PostsStore,
    comments: CommentsStore,
  },
  services: {},
});

export type AppRootStore = typeof rootStore;
