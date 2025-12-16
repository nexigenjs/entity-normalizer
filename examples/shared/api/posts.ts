import { delay } from './utils';
import { posts } from './db';
import type { PostDto, PostGroup } from './dto';

export const PostsApi = {
  async getPosts({
    page,
    limit,
    group,
  }: {
    page: number;
    limit: number;
    group: PostGroup;
  }): Promise<PostDto[]> {
    await delay(600);

    const filtered = posts.filter(p => p.group === group);
    const start = (page - 1) * limit;

    return filtered.slice(start, start + limit);
  },
};
