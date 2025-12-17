import { View, Text } from 'react-native';

import { styles } from './styles';

import type { PostModel } from '../../stores/posts/model';

export function PostCard({
  post,
  type,
}: {
  post: PostModel;
  type: 'fresh' | 'archived';
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {post.title}
      </Text>

      <Text style={styles.meta}>
        type: <Text style={styles.bold}>{type}</Text>
      </Text>

      <Text style={styles.meta}>
        viewer: <Text style={styles.bold}>{post.viewer?.name ?? '—'}</Text>
      </Text>

      <Text style={styles.meta}>
        comments:{' '}
        <Text style={styles.bold}>{post.commentsId?.length ?? 0}</Text>
      </Text>
    </View>
  );
}
