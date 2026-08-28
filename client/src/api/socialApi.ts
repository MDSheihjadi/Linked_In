import api from './axiosInstance';
import type { Comment, CommentsResponse, ConnectionRequest } from '../types';

export const commentsApi = {
  getComments: async (postId: string, cursor?: string | null): Promise<CommentsResponse> => {
    const { data } = await api.get<CommentsResponse>(`/posts/${postId}/comments`, {
      params: cursor ? { cursor } : {},
    });
    return data;
  },
  addComment: async (postId: string, text: string): Promise<Comment> => {
    const { data } = await api.post<Comment>(`/posts/${postId}/comments`, { text });
    return data;
  },
};

export const connectionsApi = {
  sendRequest: async (userId: string): Promise<ConnectionRequest> => {
    const { data } = await api.post<ConnectionRequest>(`/connections/request/${userId}`);
    return data;
  },
  acceptRequest: async (requestId: string): Promise<ConnectionRequest> => {
    const { data } = await api.patch<ConnectionRequest>(`/connections/${requestId}/accept`);
    return data;
  },
  rejectRequest: async (requestId: string): Promise<ConnectionRequest> => {
    const { data } = await api.patch<ConnectionRequest>(`/connections/${requestId}/reject`);
    return data;
  },
  getPending: async (): Promise<ConnectionRequest[]> => {
    const { data } = await api.get<ConnectionRequest[]>('/connections/pending');
    return data;
  },
};
