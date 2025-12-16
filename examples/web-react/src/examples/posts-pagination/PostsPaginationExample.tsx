import { observer } from 'mobx-react-lite';
import { useState, useEffect } from 'react';

import { PostCard } from './PostCard';
import { useStore } from '../../stores/hooks';

import type { PostModel } from '../../stores/posts/model';

type Group = 'fresh' | 'archived';

export const PostsPaginationExample = observer(() => {
  const { lists, fetchPosts, fetchMorePosts } = useStore('posts');
  const [group, setGroup] = useState<Group>('fresh');

  const collection = lists[group];

  const handleLoadMore = () => {
    fetchMorePosts[group].run({ params: { group } });
  };

  useEffect(() => {
    fetchPosts[group].run({ params: { group } });
  }, [group, fetchPosts]);

  const isLoading =
    fetchPosts[group].isLoading || fetchMorePosts[group].isLoading;

  return (
    <div style={{ padding: 16, maxWidth: 720 }}>
      <h2>Posts pagination</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => {
            setGroup('fresh');
          }}
        >
          Fresh
        </button>
        <button
          onClick={() => {
            setGroup('archived');
          }}
        >
          Archived
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {collection.getList.map((post: PostModel) => (
          <PostCard key={post.id} post={post} type={group} />
        ))}
      </div>

      {isLoading && <p>Loading…</p>}

      {!collection.hasNoMore && (
        <button style={{ marginTop: 16 }} onClick={handleLoadMore}>
          Load more
        </button>
      )}
    </div>
  );
});
