import { CommentsApi } from './comments';
import { PostsApi } from './posts';
import { ViewerApi } from './viewer';

export const Api = {
  Viewer: ViewerApi,
  Posts: PostsApi,
  Comments: CommentsApi,
};
