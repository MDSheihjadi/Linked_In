import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { postsApi } from '../api/postsApi';
import type { Post, ApiError } from '../types';
import axios from 'axios';
import type { RootState } from './store';

const postsAdapter = createEntityAdapter<Post, string>({
  selectId: (post) => post._id,
  sortComparer: (a, b) => (a.createdAt < b.createdAt ? 1 : -1),
});

interface PostsExtraState {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  nextCursor: string | null;
  hasMore: boolean;
}

const initialState = postsAdapter.getInitialState<PostsExtraState>({
  status: 'idle',
  error: null,
  nextCursor: null,
  hasMore: true,
});

function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError<ApiError>(err)) {
    return err.response?.data?.message ?? 'Something went wrong.';
  }
  return 'Something went wrong.';
}

export const fetchFeed = createAsyncThunk<
  { posts: Post[]; nextCursor: string | null },
  string | null | undefined
>('posts/fetchFeed', async (cursor, { rejectWithValue }) => {
  try {
    return await postsApi.getFeed(cursor);
  } catch (err) {
    return rejectWithValue(extractErrorMessage(err));
  }
});

export const createPostThunk = createAsyncThunk<Post, { content: string; imageUrl?: string }>(
  'posts/create',
  async ({ content, imageUrl }, { rejectWithValue }) => {
    try {
      return await postsApi.createPost(content, imageUrl);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

export const deletePostThunk = createAsyncThunk<string, string>(
  'posts/delete',
  async (id, { rejectWithValue }) => {
    try {
      await postsApi.deletePost(id);
      return id;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

export const toggleLikeThunk = createAsyncThunk<
  { liked: boolean; likesCount: number; post: Post },
  string
>('posts/toggleLike', async (postId, { rejectWithValue }) => {
  try {
    return await postsApi.toggleLike(postId);
  } catch (err) {
    return rejectWithValue(extractErrorMessage(err));
  }
});

export const sharePostThunk = createAsyncThunk<Post, string>(
  'posts/share',
  async (postId, { rejectWithValue }) => {
    try {
      return await postsApi.sharePost(postId);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    commentCountChanged: (state, action: PayloadAction<{ postId: string; delta: number }>) => {
      const post = state.entities[action.payload.postId];
      if (post) {
        post.commentsCount = Math.max(0, post.commentsCount + action.payload.delta);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeed.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        state.status = 'succeeded';
        postsAdapter.upsertMany(state, action.payload.posts);
        state.nextCursor = action.payload.nextCursor;
        state.hasMore = action.payload.nextCursor !== null;
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) ?? 'Failed to load feed.';
      })
      .addCase(createPostThunk.fulfilled, (state, action: PayloadAction<Post>) => {
        postsAdapter.addOne(state, action.payload);
      })
      .addCase(deletePostThunk.fulfilled, (state, action: PayloadAction<string>) => {
        postsAdapter.removeOne(state, action.payload);
      })
      .addCase(toggleLikeThunk.fulfilled, (state, action) => {
        postsAdapter.upsertOne(state, action.payload.post);
      })
      .addCase(sharePostThunk.fulfilled, (state, action: PayloadAction<Post>) => {
        postsAdapter.addOne(state, action.payload);
        if (action.payload.sharedFrom) {
          postsAdapter.upsertOne(state, action.payload.sharedFrom);
        }
      });
  },
});

export const postsSelectors = postsAdapter.getSelectors<RootState>((state) => state.posts);
export const { commentCountChanged } = postsSlice.actions;
export default postsSlice.reducer;
