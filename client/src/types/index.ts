export interface AuthorSummary {
  _id: string;
  name: string;
  headline?: string;
  avatarUrl?: string;
}

export interface User extends AuthorSummary {
  email: string;
  bio?: string;
  connections: string[];
  createdAt: string;
}

export interface Post {
  _id: string;
  author: AuthorSummary;
  content: string;
  imageUrl?: string;
  likes: string[];
  commentsCount: number;
  sharesCount: number;
  createdAt: string;
  sharedFrom?: Post | null;
}

export interface Comment {
  _id: string;
  post: string;
  author: AuthorSummary;
  text: string;
  createdAt: string;
}

export interface ConnectionRequest {
  _id: string;
  from: AuthorSummary;
  to: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface PaginatedResponse {
  nextCursor: string | null;
}
export interface FeedResponse extends PaginatedResponse {
  posts: Post[];
}
export interface CommentsResponse extends PaginatedResponse {
  comments: Comment[];
}

export interface ApiError {
  message: string;
}
