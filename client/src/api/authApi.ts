import api from './axiosInstance';
import type { User } from '../types';

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}
export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  signup: async (payload: SignupPayload): Promise<User> => {
    const { data } = await api.post<User>('/auth/signup', payload);
    return data;
  },
  login: async (payload: LoginPayload): Promise<User> => {
    const { data } = await api.post<User>('/auth/login', payload);
    return data;
  },
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
  getMe: async (): Promise<User> => {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },
};
