import { commentsByPost } from './db';
import { delay } from './utils';

import type { CommentDto } from './dto';

export const CommentsApi = {
  async getCommentsByPost({
    postId,
    page,
    limit,
  }: {
    postId: string;
    page: number;
    limit: number;
  }): Promise<CommentDto[]> {
    await delay(500);

    const all = commentsByPost[postId] ?? [];
    const start = (page - 1) * limit;

    return all.slice(start, start + limit);
  },
};
