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
  const [isLoadingAuth, setIsLoadingAuth] = useState(!DEV_MODE);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(DEV_MODE);
  const appPublicSettings = { id: 'philomni', public_settings: {} };

  useEffect(() => {
    if (DEV_MODE) return;
    checkUserAuth();

    // Listen for Supabase auth state changes (login, logout, token refresh)
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
  }, []);

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
    setIsLoadingAuth(true);
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setIsAuthenticated(false);
        // Only set auth_required when Supabase is reachable — if it errors
        // (e.g. placeholder URL in .env.local) treat as unauthenticated but
        // don't trigger the redirect loop.
        if (!error) {
          setAuthError({ type: 'auth_required', message: 'Please sign in' });
        }
      }
    } catch (err) {
      // Network error / unreachable — don't loop-redirect, just show login.
      console.warn('Auth check failed (check Supabase env vars):', err.message);
      setIsAuthenticated(false);
      setAuthError({ type: 'auth_required', message: 'Please sign in' });
    } finally {
      setIsLoadingAuth(false);
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
