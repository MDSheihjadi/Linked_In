import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { postsApi } from '../api/postsApi';
import type { Post, ApiError } from '../types';
import axios from 'axios';
import type { RootState } from './store';

// createEntityAdapter gives us the normalized shape:
//   { ids: ['id1','id2',...], entities: { id1: {...}, id2: {...} } }
// instead of a flat array. Why this matters concretely: if the same
// post shows up in the feed AND on a user's profile page, there's
// only ONE copy of that post's data in the store. Liking it in either
// place updates state.entities[postId] once — both views react to the
// same object, so they can never go out of sync with each other.
const postsAdapter = createEntityAdapter<Post, string>({
  // MongoDB documents use `_id`, not `id` — createEntityAdapter
  // defaults to expecting `id`, so this MUST be told explicitly (both
  // the selectId function AND the `string` id type argument), or it
  // fails to compile / silently mis-keys entities.
  selectId: (post) => post._id,
  sortComparer: (a, b) => (a.createdAt < b.createdAt ? 1 : -1), // newest first
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

export const createPostThunk = createAsyncThunk<
  Post,
  { content: string; imageUrl?: string }
>('posts/create', async ({ content, imageUrl }, { rejectWithValue }) => {
  try {
    return await postsApi.createPost(content, imageUrl);
  } catch (err) {
    return rejectWithValue(extractErrorMessage(err));
  }
});

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
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeed.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // upsertMany merges new posts into the normalized map without
        // wiping out ones already loaded from a previous page.
        postsAdapter.upsertMany(state, action.payload.posts);
        state.nextCursor = action.payload.nextCursor;
        state.hasMore = action.payload.nextCursor !== null;
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) ?? 'Failed to load feed.';
      })
      .addCase(createPostThunk.fulfilled, (state, action: PayloadAction<Post>) => {
        // addOne puts the new post at the front conceptually — actual
        // order is controlled by sortComparer above, so this "just
        // works" regardless of insertion order.
        postsAdapter.addOne(state, action.payload);
      })
      .addCase(deletePostThunk.fulfilled, (state, action: PayloadAction<string>) => {
        postsAdapter.removeOne(state, action.payload);
      })
      .addCase(toggleLikeThunk.fulfilled, (state, action) => {
        // Only this one post's entity updates — any other component
        // rendering the same post (e.g. profile page) re-renders with
        // the fresh like count automatically, since they read from
        // the same normalized entity.
        postsAdapter.upsertOne(state, action.payload.post);
      })
      .addCase(sharePostThunk.fulfilled, (state, action: PayloadAction<Post>) => {
        postsAdapter.upsertOne(state, action.payload);
      });
  },
});

// Selectors generated by the adapter — gives you selectAll, selectById,
// selectIds "for free" with correct typing against RootState.
export const postsSelectors = postsAdapter.getSelectors<RootState>(
  (state) => state.posts
);

export default postsSlice.reducer;
