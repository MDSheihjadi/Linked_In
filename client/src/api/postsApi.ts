import api from './axiosInstance';
import type { Post, FeedResponse } from '../types';

export const postsApi = {
  getFeed: async (cursor?: string | null): Promise<FeedResponse> => {
    const { data } = await api.get<FeedResponse>('/posts', {
      params: cursor ? { cursor } : {},
    });
    return data;
  },
  getUserPosts: async (userId: string, cursor?: string | null): Promise<FeedResponse> => {
    const { data } = await api.get<FeedResponse>(`/users/${userId}/posts`, {
      params: cursor ? { cursor } : {},
    });
    return data;
  },
  createPost: async (content: string, imageUrl?: string): Promise<Post> => {
    const { data } = await api.post<Post>('/posts', { content, imageUrl });
    return data;
  },
  deletePost: async (id: string): Promise<void> => {
    await api.delete(`/posts/${id}`);
  },
  toggleLike: async (
    id: string
  ): Promise<{ liked: boolean; likesCount: number; post: Post }> => {
    const { data } = await api.post(`/posts/${id}/like`);
    return data;
  },
  sharePost: async (id: string): Promise<Post> => {
    const { data } = await api.post<Post>(`/posts/${id}/share`);
    return data;
  },
};
