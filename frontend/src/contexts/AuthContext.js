import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import cacheService from '../services/cacheService';

const API = '/api';
const AuthContext = createContext(null);
const IDLE_TIMEOUT = 60 * 60 * 1000; // 1 hour
const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useAuth() {
  return useContext(AuthContext);
}

function formatError(detail) {
  if (detail == null) return 'Something went wrong.';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map(e => e?.msg || JSON.stringify(e)).join(' ');
  if (detail?.msg) return detail.msg;
  return String(detail);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastActivityRef = useRef(Date.now());
  const heartbeatRef = useRef(null);
  const idleCheckRef = useRef(null);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(data);
    } catch {
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  // Track user activity
  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Idle timeout and heartbeat
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(ev => window.addEventListener(ev, resetIdleTimer, { passive: true }));

    // Heartbeat
    heartbeatRef.current = setInterval(async () => {
      try {
        await axios.post(`${API}/auth/heartbeat`, {}, { withCredentials: true });
      } catch {}
    }, HEARTBEAT_INTERVAL);

    // Idle check
    idleCheckRef.current = setInterval(() => {
      if (Date.now() - lastActivityRef.current > IDLE_TIMEOUT) {
        logout();
      }
    }, 60000); // Check every minute

    return () => {
      events.forEach(ev => window.removeEventListener(ev, resetIdleTimer));
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (idleCheckRef.current) clearInterval(idleCheckRef.current);
    };
  }, [user, resetIdleTimer]); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email, password) => {
    try {
      const { data } = await axios.post(`${API}/auth/login`, { email, password }, { withCredentials: true });
      if (data.mfa_required) return { mfa_required: true, temp_token: data.temp_token };
      setUser(data);
      lastActivityRef.current = Date.now();
      return data;
    } catch (e) {
      throw new Error(formatError(e.response?.data?.detail));
    }
  };

  const verifyMFA = async (temp_token, otp_code) => {
    try {
      const { data } = await axios.post(`${API}/auth/mfa/verify`, { temp_token, otp_code }, { withCredentials: true });
      setUser(data);
      lastActivityRef.current = Date.now();
      return data;
    } catch (e) {
      throw new Error(formatError(e.response?.data?.detail));
    }
  };

  const backupLogin = async (temp_token, backup_code) => {
    try {
      const { data } = await axios.post(`${API}/auth/mfa/backup-login`, { temp_token, backup_code }, { withCredentials: true });
      setUser(data);
      lastActivityRef.current = Date.now();
      return data;
    } catch (e) {
      throw new Error(formatError(e.response?.data?.detail));
    }
  };

  const register = async (formData) => {
    try {
      const { data } = await axios.post(`${API}/auth/register`, formData, { withCredentials: true });
      setUser(data);
      return data;
    } catch (e) {
      throw new Error(formatError(e.response?.data?.detail));
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch {}
    // Clear ALL cached data on logout (security: prevent data leakage)
    cacheService.clearAll();
    setUser(false);
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    if (idleCheckRef.current) clearInterval(idleCheckRef.current);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyMFA, backupLogin, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
