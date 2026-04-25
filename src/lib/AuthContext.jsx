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
  // Start as false in prod so ProtectedRoute waits before making redirect decision
  const [authChecked, setAuthChecked] = useState(DEV_MODE);
  const appPublicSettings = { id: 'philomni', public_settings: {} };

  useEffect(() => {
    if (DEV_MODE) return;

    // onAuthStateChange fires INITIAL_SESSION on mount (restores from localStorage),
    // then SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED on subsequent changes.
    // This single handler covers all cases without a separate getSession() call.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setAuthChecked(true);
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

      if (merged.dark_mode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
      setUser({ id: authUser.id, email: authUser.email });
      setIsAuthenticated(true);
    } finally {
      // Always mark auth as checked once profile load completes
      setAuthChecked(true);
    }
  };

  // Kept for manual re-checks (e.g. after OAuth redirect). Primary auth
  // restoration is handled by onAuthStateChange(INITIAL_SESSION) above.
  const checkUserAuth = async () => {
    if (DEV_MODE) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) await loadUserProfile(session.user);
      else { setIsAuthenticated(false); setAuthChecked(true); }
    } catch (err) {
      console.warn('Auth check failed:', err.message);
      setIsAuthenticated(false);
      setAuthChecked(true);
    }
  };

  const logout = async () => {
    if (DEV_MODE) return;
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out error:', err.message);
    }
    setUser(null);
    setIsAuthenticated(false);
    setAuthChecked(true);
    // Navigate to home — full reload clears any stale state
    window.location.href = '/';
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
