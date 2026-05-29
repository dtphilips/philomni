import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

// Hardcoded admin emails — always get is_admin=true and plan=promax
const ADMIN_EMAILS = ['dtphilips1992@gmail.com']

// DEV_MODE bypass: set VITE_DEV_MODE=true in .env.local only
const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true' && import.meta.env.DEV
const DEV_USER = DEV_MODE ? {
  id: 'dev-user-id',
  email: 'dev@philomni.app',
  full_name: 'Dami Dev',
  avatar_url: null,
  role: 'creator',
  plan: 'promax',
  is_admin: true,
} : null

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(DEV_USER)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(DEV_USER)
  const [loading, setLoading] = useState(DEV_MODE ? false : true)

  // ─── Fetch / auto-create profile row ────────────────────────────────────────
  const fetchProfile = async (authUser) => {
    if (!authUser) return null

    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (data) return data

    // Auto-create profile on very first login
    const newProfile = {
      id:         authUser.id,
      email:      authUser.email,
      full_name:  authUser.user_metadata?.full_name || authUser.email.split('@')[0],
      avatar_url: authUser.user_metadata?.avatar_url || null,
      role:       'creator',
      plan:       'free',
      created_at: new Date().toISOString(),
    }
    const { data: created } = await supabase
      .from('users')
      .insert(newProfile)
      .select()
      .single()
    return created || newProfile
  }

  // ─── Boot auth ───────────────────────────────────────────────────────────────
  useEffect(() => {
    // Apply dark mode globally
    document.documentElement.classList.add('dark')

    if (DEV_MODE) return

    let mounted = true

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!mounted) return

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          const prof = await fetchProfile(session.user)
          if (mounted) setProfile(prof)
        } else {
          setProfile(null)
        }
      } catch (err) {
        console.error('[Auth] init error:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event)
        if (!mounted) return

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          const prof = await fetchProfile(session.user)
          if (mounted) setProfile(prof)
        } else {
          setProfile(null)
        }

        if (mounted) setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // ─── Auth actions ─────────────────────────────────────────────────────────────
  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
    localStorage.clear()
    window.location.href = '/login'
  }

  const refreshProfile = async () => {
    if (!user) return
    const prof = await fetchProfile(user)
    setProfile(prof)
  }

  // ─── Computed values ──────────────────────────────────────────────────────────
  const isHardcodedAdmin = user
    ? ADMIN_EMAILS.includes((user.email || '').toLowerCase())
    : false

  // Merge auth user + DB profile into one object pages can consume
  const fullUser = user
    ? profile
      ? {
          ...user,
          ...profile,
          is_admin: profile.is_admin === true || isHardcodedAdmin,
          plan: (profile.is_admin === true || isHardcodedAdmin) ? 'promax' : (profile.plan || 'free'),
        }
      : {
          // Profile not loaded yet — serve basic auth data so app doesn't redirect to /login
          id:         user.id,
          email:      user.email,
          full_name:  user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          avatar_url: user.user_metadata?.avatar_url || null,
          role:       'creator',
          plan:       isHardcodedAdmin ? 'promax' : 'free',
          is_admin:   isHardcodedAdmin,
        }
    : null

  const effectivePlan = fullUser?.plan || 'free'

  const value = {
    user:    fullUser,
    session,
    loading,
    profile,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    isAdmin:  fullUser?.is_admin === true,
    isPro:    effectivePlan === 'pro' || effectivePlan === 'promax' || fullUser?.is_admin === true,
    isProMax: effectivePlan === 'promax' || fullUser?.is_admin === true,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
