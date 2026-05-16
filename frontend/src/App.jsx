import { useEffect, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth }   from './context/AuthContext';
import { useApp }    from './context/AppContext';
import MainLayout    from './components/Layout/MainLayout';
import AuthPage      from './pages/AuthPage';
import Dashboard     from './pages/Dashboard';
import EventsPage    from './pages/EventsPage';
import MyEventsPage  from './pages/MyEventsPage';
import ProfilePage   from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import AdminPage     from './pages/AdminPage';
import Toast         from './components/common/Toast';
import { Confetti } from "./components/common/index.jsx";

// ─── Protected route wrapper ──────────────────────────────────────────────────
function Protected({ children, adminOnly = false }) {
  const { user, isAdmin } = useAuth();
  if (!user)             return <Navigate to="/auth" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { toasts, dismissToast, confetti } = useApp();
  const { user } = useAuth();

  // Keyboard shortcut: Ctrl+K / Cmd+K for search
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // trigger search via AppContext if needed
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {/* Global background mesh */}
      <div className="root-bg" />

      {/* Toast notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Confetti */}
      <Confetti active={confetti} />

      <Routes>
        {/* Auth */}
        <Route
          path="/auth"
          element={user ? <Navigate to="/" replace /> : <AuthPage />}
        />

        {/* App shell */}
        <Route
          path="/*"
          element={
            <Protected>
              <MainLayout />
            </Protected>
          }
        >
          <Route index                   element={<Dashboard />} />
          <Route path="events"           element={<EventsPage />} />
          <Route path="my-events"        element={<MyEventsPage />} />
          <Route path="profile"          element={<ProfilePage />} />
          <Route path="notifications"    element={<NotificationsPage />} />
          <Route
            path="admin"
            element={
              <Protected adminOnly>
                <AdminPage />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}
