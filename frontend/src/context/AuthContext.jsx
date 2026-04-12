import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('ef_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  // Listen for forced logout (401 from API interceptor)
  useEffect(() => {
    const handler = () => { setUser(null); };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await authApi.login({ email, password });
      localStorage.setItem('ef_token', data.token);
      localStorage.setItem('ef_user',  JSON.stringify(data.user));
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setLoading(true);
    try {
      const { data } = await authApi.register(payload);
      if (data.token) {
        localStorage.setItem('ef_token', data.token);
        localStorage.setItem('ef_user',  JSON.stringify(data.user));
        setUser(data.user);
      }
      return { success: true, message: data.message, adminPending: !data.token };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ef_token');
    localStorage.removeItem('ef_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('ef_user', JSON.stringify(next));
      return next;
    });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authApi.me();
      localStorage.setItem('ef_user', JSON.stringify(data.user));
      setUser(data.user);
    } catch { /* token invalid — interceptor handles logout */ }
  }, []);

  const isAdmin      = user?.role === 'Admin' || user?.role === 'SuperAdmin';
  const isSuperAdmin = user?.role === 'SuperAdmin';

  return (
    <AuthContext.Provider value={{
      user, loading, isAdmin, isSuperAdmin,
      login, register, logout, updateUser, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
