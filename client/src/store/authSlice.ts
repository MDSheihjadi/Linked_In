import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '../api/authApi';
import type { LoginPayload, SignupPayload } from '../api/authApi';
import type { User, ApiError } from '../types';
import axios from 'axios';

interface AuthState {
  user: User | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
  initialized: false,
};

function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError<ApiError>(err)) {
    return err.response?.data?.message ?? 'Something went wrong.';
  }
  return 'Something went wrong.';
}

export const signupThunk = createAsyncThunk<User, SignupPayload>(
  'auth/signup',
  async (payload, { rejectWithValue }) => {
    try {
      return await authApi.signup(payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

export const loginThunk = createAsyncThunk<User, LoginPayload>(
  'auth/login',
  async (payload, { rejectWithValue }) => {
    try {
      return await authApi.login(payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

export const fetchCurrentUser = createAsyncThunk<User, void>(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      return await authApi.getMe();
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

export const logoutThunk = createAsyncThunk<void, void>('auth/logout', async () => {
  await authApi.logout();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    userUpdated: (state, action: PayloadAction<User>) => {
      if (state.user && state.user._id === action.payload._id) {
        state.user = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signupThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(signupThunk.fulfilled, (state, action: PayloadAction<User>) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(signupThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) ?? 'Signup failed.';
      })
      .addCase(loginThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action: PayloadAction<User>) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) ?? 'Login failed.';
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
        state.status = 'succeeded';
        state.initialized = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.status = 'idle';
        state.initialized = true;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.status = 'idle';
      });
  },
});

export const { userUpdated } = authSlice.actions;
export default authSlice.reducer;
