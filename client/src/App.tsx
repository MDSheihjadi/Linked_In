import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import AuthPage from './pages/AuthPage';
import FeedPage from './pages/FeedPage';
import ConnectionsPage from './pages/ConnectionsPage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import NavBar from './components/NavBar';
import ProtectedRoute, { useSessionCheck } from './components/ProtectedRoute';
import { ToastProvider } from './context/ToastContext';
import CommandPalette from './components/CommandPalette';
import ShortcutsHelp from './components/ShortcutsHelp';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function AppRoutes() {
  useSessionCheck();
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useKeyboardShortcuts({
    'mod+k': () => setCmdkOpen(true),
    '?': () => setHelpOpen(true),
    escape: () => {
      setCmdkOpen(false);
      setHelpOpen(false);
    },
  });

  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <FeedPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/connections"
          element={
            <ProtectedRoute>
              <ConnectionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:userId"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <SearchPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/feed" replace />} />
      </Routes>
      <CommandPalette open={cmdkOpen} onClose={() => setCmdkOpen(false)} />
      <ShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  );
}
