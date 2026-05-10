import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [showLevelUp, setShowLevelUp] = useState(null);
  const [showAchievement, setShowAchievement] = useState(null);

  // Check localStorage for existing session
  useEffect(() => {
    const saved = localStorage.getItem('fitness_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        api.getUser(parsed.id).then(data => {
          setUser(data.user);
        }).catch(() => {
          localStorage.removeItem('fitness_user');
        }).finally(() => setLoading(false));
      } catch {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const addToast = useCallback((title, body, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, body, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.getUser(user.id);
      setUser(data.user);
      localStorage.setItem('fitness_user', JSON.stringify(data.user));
    } catch (e) {
      console.error('Refresh user failed:', e);
    }
  }, [user]);

  const login = useCallback(async (username, password) => {
    const data = await api.login(username, password);
    setUser(data.user);
    localStorage.setItem('fitness_user', JSON.stringify(data.user));
    return data.user;
  }, []);

  const register = useCallback(async (username, password) => {
    const data = await api.register(username, password);
    setUser(data.user);
    localStorage.setItem('fitness_user', JSON.stringify(data.user));
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('fitness_user');
  }, []);

  const value = {
    user, setUser, loading, toasts, addToast, showLevelUp, setShowLevelUp,
    showAchievement, setShowAchievement, refreshUser, login, register, logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
