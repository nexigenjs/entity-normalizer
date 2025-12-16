export const ENTITY_KEY = {
  COMMENTS: 'comments',
  VIEWERS: 'viewers',
  POSTS: 'posts',
} as const;

export const REF_SOURCE = {
  //collections
  POSTS: 'posts-feed',
  COMMENTS: 'comments-feed',

  //records
  CURRENT_VIEWER: 'current_viewer',
};
