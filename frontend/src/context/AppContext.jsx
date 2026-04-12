import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [toasts,           setToasts]          = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebar,    setMobileSidebar]    = useState(false);
  const [confetti,         setConfetti]         = useState(false);
  const [notifCount,       setNotifCount]       = useState(0);
  const [searchOpen,       setSearchOpen]       = useState(false);
  const [currentPage,      setCurrentPage]      = useState('dashboard');

  // ── Toast system ──────────────────────────────────────────────────────────
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    const icons = {
      success: 'bi-check-circle-fill',
      danger:  'bi-x-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      info:    'bi-info-circle-fill',
    };
    setToasts(t => [...t, { id, message, type, icon: icons[type] || icons.info }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  // ── Confetti ──────────────────────────────────────────────────────────────
  const triggerConfetti = useCallback(() => {
    setConfetti(true);
    setTimeout(() => setConfetti(false), 5000);
  }, []);

  const value = useMemo(() => ({
    toasts, showToast, dismissToast,
    sidebarCollapsed, setSidebarCollapsed,
    mobileSidebar, setMobileSidebar,
    confetti, triggerConfetti,
    notifCount, setNotifCount,
    searchOpen, setSearchOpen,
    currentPage, setCurrentPage,
  }), [
    toasts, showToast, dismissToast,
    sidebarCollapsed, mobileSidebar,
    confetti, triggerConfetti,
    notifCount, searchOpen, currentPage,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
