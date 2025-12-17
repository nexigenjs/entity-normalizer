import { randomFrom } from './utils';

import type { ViewerDto, PostDto, CommentDto, PostGroup } from './dto';

// --------------------
// viewers (FULL)
// --------------------
export const viewers: ViewerDto[] = Array.from({ length: 5 }).map((_, i) => ({
  id: `u${i + 1}`,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  avatarUrl: `https://i.pravatar.cc/150?img=${i + 10}`,
  bio: `Bio of user ${i + 1}`,
}));

const toViewerPreview = (viewer: ViewerDto) => ({
  id: viewer.id,
  name: viewer.name,
  avatarUrl: viewer.avatarUrl,
});

// --------------------
// comments
// --------------------
export const commentsByPost: Record<string, CommentDto[]> = {};

function generateComments(postId: string): CommentDto[] {
  return Array.from({ length: 30 }).map((_, i) => {
    const viewer = randomFrom(viewers);

    return {
      id: `${postId}-c${i + 1}`,
      text: `Comment ${i + 1} for post ${postId}`,
      viewer: toViewerPreview(viewer),
    };
  });
}

// --------------------
// posts (WITH GROUPS)
// --------------------
export const posts: PostDto[] = Array.from({ length: 100 }).map((_, i) => {
  const id = `p${i + 1}`;
  const allComments = generateComments(id);
  const viewer = randomFrom(viewers);

  const group: PostGroup = i < 50 ? 'fresh' : 'archived';

  commentsByPost[id] = allComments;

  return {
    id,
    title: `Post ${i + 1}`,
    viewer: toViewerPreview(viewer),
    comments: allComments.slice(0, 5),
    group,
  };
});
