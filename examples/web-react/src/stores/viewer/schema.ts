import { createEntitySchema } from '@nexigen/entity-normalizer';
import { ENTITY_KEY } from '../../constants';
import { ViewerModel } from './model';

export const viewerSchema = createEntitySchema(
  ENTITY_KEY.VIEWERS,
  {},
  {
    model: ViewerModel,
    idAttribute: props => props.id,
  },
);