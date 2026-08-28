import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

// Every component imports THESE, never the raw react-redux hooks.
// useAppDispatch knows about our thunks' return types; useAppSelector
// knows the shape of RootState — so `state.posts` autocompletes and
// `state.typo` is a compile error, not a silent `undefined`.
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
