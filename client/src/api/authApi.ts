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

// Every function here declares exactly what it returns. A component
// calling authApi.login(...) gets full autocomplete on the result and
// a compile error if it tries to access a field that doesn't exist —
// this is the concrete payoff of the TS refactor mentioned in the
// resume bullet.
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
