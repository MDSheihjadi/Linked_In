import api from './axiosInstance';
import type { User, Post } from '../types';

export const usersApi = {
  getProfile: async (userId: string): Promise<User> => {
    const { data } = await api.get<User>(`/users/${userId}`);
    return data;
  },
  updateProfile: async (
    userId: string,
    updates: Partial<Pick<User, 'name' | 'headline' | 'bio' | 'avatarUrl'>>
  ): Promise<User> => {
    const { data } = await api.patch<User>(`/users/${userId}`, updates);
    return data;
  },
};

export interface SearchResults {
  users?: User[];
  posts?: Post[];
}

export const searchApi = {
  search: async (query: string, type?: 'user' | 'post'): Promise<SearchResults> => {
    const { data } = await api.get<SearchResults>('/search', {
      params: { q: query, ...(type ? { type } : {}) },
    });
    return data;
  },
};
