import { createEntitySchema } from '@nexigen/entity-normalizer';
import { ENTITY_KEY } from '../../constants';
import { CommentModel } from './models';
import { viewerSchema } from '../viewer/schema';

export const commentSchema = createEntitySchema(
  ENTITY_KEY.COMMENTS,
  {
    viewer: viewerSchema,
  },
  {
    model: CommentModel,
    idAttribute: props => props.id,
  },
);