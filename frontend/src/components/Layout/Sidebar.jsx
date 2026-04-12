import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth }  from '../../context/AuthContext';
import { useApp }   from '../../context/AppContext';

const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const NAV = [
  {
    section: 'Main',
    items: [
      { label: 'Dashboard',     icon: 'bi-speedometer2', path: '/'             },
      { label: 'Events',        icon: 'bi-calendar-event', path: '/events'     },
      { label: 'My Events',     icon: 'bi-bookmark-check', path: '/my-events'  },
      { label: 'Leaderboard',   icon: 'bi-trophy',       path: '/leaderboard'  },
    ],
  },
  {
    section: 'Account',
    items: [
      { label: 'Notifications', icon: 'bi-bell',     path: '/notifications', badge: true },
      { label: 'Profile',       icon: 'bi-person',   path: '/profile'                   },
    ],
  },
];

const ADMIN_NAV = {
  section: 'Admin',
  items: [
    { label: 'Admin Panel', icon: 'bi-shield-check', path: '/admin' },
  ],
};

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const { sidebarCollapsed, setSidebarCollapsed, notifCount, mobileSidebar, setMobileSidebar } = useApp();
  const navigate  = useNavigate();
  const location  = useLocation();

  const navSections = isAdmin ? [...NAV, ADMIN_NAV] : NAV;

  const go = (path) => {
    navigate(path);
    setMobileSidebar(false);
  };

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      {/* Mobile overlay */}
      {mobileSidebar && (
        <div
          onClick={() => setMobileSidebar(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 99, backdropFilter: 'blur(4px)',
          }}
        />
      )}

      <aside
        className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileSidebar ? 'mobile-open' : ''}`}
        style={mobileSidebar ? { transform: 'translateX(0)' } : undefined}
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <i className="bi bi-stars" />
          </div>
          {!sidebarCollapsed && (
            <div className="sidebar-logo-text">
              KLU <span>Sparkz</span>
            </div>
          )}
          {!sidebarCollapsed && (
            <button
              className="collapse-btn"
              onClick={() => setSidebarCollapsed(true)}
              title="Collapse sidebar"
            >
              <i className="bi bi-chevron-left" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navSections.map((section) => (
            <div key={section.section}>
              {!sidebarCollapsed && (
                <div className="nav-section-label">{section.section}</div>
              )}
              {section.items.map((item) => (
                <div
                  key={item.path}
                  className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => go(item.path)}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <i className={`bi ${item.icon} nav-icon`} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="nav-label">{item.label}</span>
                      {item.badge && notifCount > 0 && (
                        <span className="nav-badge">{notifCount}</span>
                      )}
                    </>
                  )}
                  {sidebarCollapsed && item.badge && notifCount > 0 && (
                    <span style={{
                      position: 'absolute', top: 6, right: 6,
                      width: 8, height: 8, borderRadius: '50%',
                      background: 'var(--rose)',
                    }} />
                  )}
                </div>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {sidebarCollapsed ? (
            <button
              className="collapse-btn"
              style={{ margin: '0 auto', display: 'flex' }}
              onClick={() => setSidebarCollapsed(false)}
              title="Expand sidebar"
            >
              <i className="bi bi-chevron-right" />
            </button>
          ) : (
            <div className="sidebar-user" onClick={() => go('/profile')}>
              <div className="user-avatar">
                {user?.avatar_url
                  ? <img src={user.avatar_url} alt={user.name} />
                  : getInitials(user?.name)}
              </div>
              <div className="user-info">
                <div className="user-name">{user?.name}</div>
                <div className="user-role">{user?.role}</div>
              </div>
              <button
                className="collapse-btn"
                onClick={(e) => { e.stopPropagation(); logout(); }}
                title="Sign out"
              >
                <i className="bi bi-box-arrow-right" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
