import { type ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCurrentUser } from '../store/authSlice';

export function useSessionCheck() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);
}

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, initialized } = useAppSelector((state) => state.auth);

  if (!initialized) {
    return <p style={{ textAlign: 'center', marginTop: 40 }}>Loading…</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
