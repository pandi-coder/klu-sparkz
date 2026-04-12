// ─── Topbar ───────────────────────────────────────────────────────────────────
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useApp }  from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar     from './Sidebar';

const PAGE_TITLES = {
  '/':              'Dashboard',
  '/events':        'Browse Events',
  '/my-events':     'My Registrations',
  '/leaderboard':   'Leaderboard',
  '/notifications': 'Notifications',
  '/profile':       'My Profile',
  '/admin':         'Admin Panel',
};

const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

export function Topbar() {
  const { sidebarCollapsed, notifCount, setMobileSidebar } = useApp();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const title = PAGE_TITLES[location.pathname] || 'KLU Sparkz';

  return (
    <header className="topbar">
      {/* Mobile hamburger */}
      <button
        className="icon-btn"
        style={{ display: 'none' }}
        id="mobile-menu-btn"
        onClick={() => setMobileSidebar(v => !v)}
      >
        <i className="bi bi-list" />
      </button>

      <div className="topbar-title">{title}</div>

      {/* Search trigger */}
      <div className="search-trigger" onClick={() => navigate('/events')}>
        <i className="bi bi-search" style={{ fontSize: '0.9rem' }} />
        <span>Search events…</span>
        <kbd>⌘K</kbd>
      </div>

      <div className="topbar-actions">
        {/* Notifications */}
        <button
          className="icon-btn"
          onClick={() => navigate('/notifications')}
          title="Notifications"
        >
          <i className="bi bi-bell" />
          {notifCount > 0 && <span className="notif-dot" />}
        </button>

        {/* Profile avatar */}
        <button
          className="icon-btn"
          style={{ padding: 0, overflow: 'hidden' }}
          onClick={() => navigate('/profile')}
          title="My Profile"
        >
          <div className="user-avatar" style={{ width: 38, height: 38, borderRadius: 10, fontSize: '0.8rem' }}>
            {user?.avatar_url
              ? <img src={user.avatar_url} alt={user?.name} />
              : getInitials(user?.name)}
          </div>
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </header>
  );
}

// ─── MainLayout ───────────────────────────────────────────────────────────────
export default function MainLayout() {
  const { sidebarCollapsed } = useApp();

  return (
    <div className="layout">
      <Sidebar />
      <main className={`main-area ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Topbar />
        <div className="page-content page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
