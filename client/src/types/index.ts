// These interfaces mirror the Mongoose schemas on the backend. Keeping
// them in one place means every component/slice that touches a User
// or Post is checked against the SAME shape — if the backend response
// shape changes, TypeScript will flag every place in the frontend
// that breaks, at compile time, instead of you discovering it as a
// runtime "undefined is not an object" in the browser.

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

// Generic shape every cursor-paginated list endpoint returns.
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
