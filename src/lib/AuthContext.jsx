import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

const DEV_USER = {
  id: 'dev-user-001',
  email: 'dev@philomni.com',
  full_name: 'Dev User',
  role: 'creator',
  plan: 'pro',
  avatar_url: null,
  dark_mode: false,
  bio: 'Local dev account — set VITE_DEV_MODE=false to enable real auth',
  location: 'Localhost',
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(DEV_MODE ? DEV_USER : null);
  const [isAuthenticated, setIsAuthenticated] = useState(DEV_MODE);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(true);
  const appPublicSettings = { id: 'philomni', public_settings: {} };

  useEffect(() => {
    if (DEV_MODE) return;
    checkUserAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
        setAuthChecked(true);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        await loadUserProfile(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserProfile = async (authUser) => {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const merged = {
        id: authUser.id,
        email: authUser.email,
        ...(profile ?? {}),
      };

      setUser(merged);
      setIsAuthenticated(true);

      // Apply dark mode preference
      if (merged.dark_mode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
      setUser({ id: authUser.id, email: authUser.email });
      setIsAuthenticated(true);
    }
  };

  const checkUserAuth = async () => {
    if (DEV_MODE) return;
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('auth_timeout')), 2000)
      );
      const sessionCheck = supabase.auth.getSession();
      const { data: { session }, error } = await Promise.race([sessionCheck, timeout]);
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setIsAuthenticated(false);
        if (!error) {
          setAuthError({ type: 'auth_required', message: 'Please sign in' });
        }
      }
    } catch (err) {
      console.warn('Auth check failed:', err.message);
      setIsAuthenticated(false);
    } finally {
      setAuthChecked(true);
    }
  };

  const logout = () => {
    if (DEV_MODE) return;
    supabase.auth.signOut().then(() => {
      setUser(null);
      setIsAuthenticated(false);
    });
  };

  const navigateToLogin = () => {
    if (DEV_MODE) return;
    const returnUrl = window.location.pathname + window.location.search;
    window.location.href = `/login?returnUrl=${encodeURIComponent(returnUrl)}`;
  };

  const refreshUser = async () => {
    if (DEV_MODE) return;
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) await loadUserProfile(authUser);
  };

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState: checkUserAuth,
      refreshUser,
      DEV_MODE,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
