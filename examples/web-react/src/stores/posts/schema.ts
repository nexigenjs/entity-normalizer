import { createEntitySchema } from '@nexigen/entity-normalizer';
import { ENTITY_KEY } from '../../constants';
import { PostModel } from './models';
import { viewerSchema } from '../viewer/schema';
import { commentSchema } from '../comments/schema';

export const postSchema = createEntitySchema(
  ENTITY_KEY.POSTS,
  {
    viewer: viewerSchema,
    comments: [commentSchema],
  },
  {
    model: PostModel,
    idAttribute: props => props.id,
  },
);