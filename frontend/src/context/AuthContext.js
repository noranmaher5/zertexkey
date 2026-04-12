import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react';

import { authAPI, systemAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(true);

  // ─────────────────────────────────────────────
  // Backend health check
  // ─────────────────────────────────────────────
  useEffect(() => {
    let alive = true;

    systemAPI.health()
      .then(() => {
        if (alive) setBackendOnline(true);
      })
      .catch(() => {
        if (!alive) return;
        setBackendOnline(false);
        console.warn('Backend is unreachable');
        toast.error('Backend is unreachable. Please start server.');
      });

    return () => {
      alive = false;
    };
  }, []);

  // ─────────────────────────────────────────────
  // Restore session
  // ─────────────────────────────────────────────
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('dv_token');
      const cachedUser = localStorage.getItem('dv_user');

      if (!token) {
        setLoading(false);
        return;
      }

      // 1) set cached user immediately (UI faster)
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch (_) {}
      }

      try {
        // 2) verify token with backend
        const res = await authAPI.getMe();
        setUser(res.data.user);
        localStorage.setItem('dv_user', JSON.stringify(res.data.user));
      } catch (err) {
        // only clear if token is truly invalid
        if (err.response?.status === 401) {
          localStorage.removeItem('dv_token');
          localStorage.removeItem('dv_user');
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // ─────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user } = res.data;
    localStorage.setItem('dv_token', token);
    localStorage.setItem('dv_user', JSON.stringify(user));
    setUser(user);
    return user;
  }, []);

  // ─────────────────────────────────────────────
  // REGISTER
  // ─────────────────────────────────────────────
  const register = useCallback(async (name, email, password, phone) => {
    const res = await authAPI.register({ name, email, password, phone });
    const { token, user } = res.data;
    localStorage.setItem('dv_token', token);
    localStorage.setItem('dv_user', JSON.stringify(user));
    setUser(user);
    return user;
  }, []);

  // ─────────────────────────────────────────────
  // GOOGLE LOGIN — UPDATED
  // بيرجع الـ response كاملاً عشان LoginPage يقرر:
  //   - لو requiresOTP: true  → يعرض شاشة OTP
  //   - لو فيه token + user   → login مباشر (fallback)
  // ─────────────────────────────────────────────
  const googleLogin = useCallback(async (credential) => {
    const res = await authAPI.googleAuth({ token: credential });
    const data = res.data;

    // Case 1: Server requires OTP → return the data as-is for LoginPage to handle
    if (data.requiresOTP) {
      return data; // { requiresOTP: true, otpToken, email }
    }

    // Case 2: Direct login (no OTP required)
    const { token, user } = data;
    localStorage.setItem('dv_token', token);
    localStorage.setItem('dv_user', JSON.stringify(user));
    setUser(user);
    return user;
  }, []);

  // ─────────────────────────────────────────────
  // SET AUTH TOKEN — NEW
  // يُستدعى من LoginPage بعد التحقق من الـ OTP بنجاح
  // ─────────────────────────────────────────────
  const setAuthToken = useCallback((token, userData) => {
    localStorage.setItem('dv_token', token);
    localStorage.setItem('dv_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  // ─────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('dv_token');
    localStorage.removeItem('dv_user');
    setUser(null);
    toast.success('Logged out');
  }, []);

  // ─────────────────────────────────────────────
  // UPDATE USER
  // ─────────────────────────────────────────────
  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('dv_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ─────────────────────────────────────────────
  // ROLE SYSTEM
  // ─────────────────────────────────────────────
  const roleLevel = {
    user: 0,
    editor: 1,
    admin: 2,
    manager: 3,
    'co-owner': 4,
    owner: 5
  };

  const hasRole = useCallback(
    (required) => {
      if (!user) return false;
      return (roleLevel[user.role] ?? -1) >= (roleLevel[required] ?? 99);
    },
    [user]
  );

  // ─────────────────────────────────────────────
  // GLOBAL LOGOUT LISTENER
  // ─────────────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      setUser(null);
      localStorage.removeItem('dv_token');
      localStorage.removeItem('dv_user');
    };

    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  // ─────────────────────────────────────────────
  // CONTEXT VALUE
  // ─────────────────────────────────────────────
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        backendOnline,

        login,
        register,
        googleLogin,
        logout,
        updateUser,
        hasRole,
        setAuthToken,      // ← جديد

        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};