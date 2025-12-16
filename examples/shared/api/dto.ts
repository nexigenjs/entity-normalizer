export type PostGroup = 'fresh' | 'archived';

export interface ViewerDto {
  id: string;
  name: string;

  email?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface CommentDto {
  id: string;
  text: string;
  viewer: ViewerDto;
}

export interface PostDto {
  id: string;
  title: string;
  viewer: ViewerDto;
  comments: CommentDto[];
  group: PostGroup;
}

