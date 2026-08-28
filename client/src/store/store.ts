import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import postsReducer from './postsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postsReducer,
  },
});

// Derived types, not hand-written ones — if you add a slice, these
// types update automatically. This is what makes useSelector/useDispatch
// fully typed everywhere in the app without manual upkeep.
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
