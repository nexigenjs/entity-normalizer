import type { ViewerDto } from '../viewer/dto';
import type { CommentDto } from '../comments/dto';

export interface PostDto {
  id: string;
  title: string;
  viewer: ViewerDto;
  comments: CommentDto[];
}

// -----------------
// NORMALIZED DTO
// -----------------

export interface PostNormalizedDto {
  id: string;
  title: string;
  viewerId: string;
  commentIds: string[];
}