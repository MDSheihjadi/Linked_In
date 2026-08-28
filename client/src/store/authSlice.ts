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
  // Tracks whether the ONE-TIME initial session check (fetchCurrentUser
  // on app load) has finished, regardless of outcome. This is
  // deliberately separate from `status`, because `status` gets reused
  // by login/signup too — without this flag, "haven't checked session
  // yet" and "checked, and confirmed logged out" were both represented
  // as status: 'idle', and ProtectedRoute couldn't tell them apart,
  // leaving it stuck on a loading screen forever for logged-out users.
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
  initialized: false,
};

// Helper to pull a clean error message out of an Axios error without
// `any` — this pattern repeats across every thunk in the app.
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

// Called once on app load to check "is there already a valid session
// cookie?" — lets a refresh keep the user logged in without storing
// anything in localStorage ourselves.
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

export const logoutThunk = createAsyncThunk<void, void>(
  'auth/logout',
  async () => {
    await authApi.logout();
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  // extraReducers handle the pending/fulfilled/rejected lifecycle of
  // each thunk above. This is the standard RTK pattern: one place
  // maps every async outcome to a concrete state change, instead of
  // scattering isLoading/error flags across components.
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
        // Not an error worth surfacing to the user — it just means
        // "no valid session," which is a normal logged-out state.
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

export default authSlice.reducer;