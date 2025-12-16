import { type PostModel } from '../../stores/posts/model';

export function PostCard({
  post,
  type,
}: {
  post: PostModel;
  type: 'fresh' | 'archived';
}) {
  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: 6,
        padding: 12,
      }}
    >
      <h4 style={{ margin: '0 0 4px 0' }}>{post.title}</h4>
      <br />
      <small>
        type: <b>{type}</b>
      </small>
      <br />
      <small>
        viewer: <b>{post.viewer?.name ?? '—'}</b>
      </small>
      <br />
      <small>
        comments count: <b>{post.commentsId?.length ?? 0}</b>
      </small>
    </div>
  );
}
