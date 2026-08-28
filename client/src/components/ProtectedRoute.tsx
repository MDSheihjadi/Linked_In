import { type ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCurrentUser } from '../store/authSlice';

export function useSessionCheck() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    // Runs once when the app mounts: asks the backend "is there a
    // valid session cookie already?" This is how a page refresh
    // doesn't log the user out — we never stored anything ourselves,
    // the httpOnly cookie persisted in the browser and this call just
    // asks the server to confirm it's still valid.
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