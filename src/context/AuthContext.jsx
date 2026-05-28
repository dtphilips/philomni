import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

// WARNING: VITE_DEV_MODE must be 'false' in production.
// import.meta.env.DEV is Vite's built-in flag: true during `vite dev`, false after `vite build`.
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

// Hardcoded admin emails — these always get is_admin=true and plan=promax
// regardless of DB state, so admin can never be locked out.
const ADMIN_EMAILS = ['dtphilips1992@gmail.com']

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEV_USER)
  const [profile, setProfile] = useState(DEV_USER)
  const [loading, setLoading] = useState(DEV_MODE ? false : true)

  const loadProfile = async (authUser) => {
    if (!authUser) { setProfile(null); return }
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (data) {
      setProfile(data)
    } else {
      // Auto-create profile on first login
      const newProfile = {
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
        avatar_url: authUser.user_metadata?.avatar_url || null,
        role: 'creator',
        plan: 'free',
        created_at: new Date().toISOString(),
      }
      const { data: created } = await supabase.from('users').insert(newProfile).select().single()
      setProfile(created || newProfile)
    }
  }

  useEffect(() => {
    // Apply dark mode
    document.documentElement.classList.add('dark')

    if (DEV_MODE) return // skip real auth in dev mode

    // Hard 3-second timeout — app WILL unblock even if Supabase is slow
    const timeout = setTimeout(() => {
      console.warn('[Auth] Timeout — forcing loading=false after 3 s')
      setLoading(false)
    }, 3000)

    // Check session immediately; unblock loading as soon as we know auth state.
    // Profile load runs in the background — it does NOT block the app.
    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout)
      setUser(session?.user ?? null)
      setLoading(false) // unblock immediately — profile enriches separately
      if (session?.user) loadProfile(session.user) // background, non-blocking
      else setProfile(null)
    }).catch(() => {
      clearTimeout(timeout)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user)
      else setProfile(null)
    })

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

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
    try {
      localStorage.clear()
      sessionStorage.clear()
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Sign out error:', err)
    } finally {
      window.location.href = '/'
    }
  }

  const refreshProfile = () => loadProfile(user)

  // Merged object: auth user + db profile
  // Admin emails always get is_admin=true and plan=promax so they're never locked out.
  // When user is authenticated but profile hasn't loaded yet we return basic auth
  // data immediately — this prevents a flash-redirect to /login while profile loads.
  const isHardcodedAdmin = user ? ADMIN_EMAILS.includes((user.email || '').toLowerCase()) : false
  const fullUser = user
    ? profile
      ? {
          ...user,
          ...profile,
          is_admin: profile.is_admin === true || isHardcodedAdmin,
          plan:     (profile.is_admin === true || isHardcodedAdmin) ? 'promax' : (profile.plan || 'free'),
        }
      : {
          // Profile not yet loaded — serve basic auth data so the app doesn't redirect to login
          id:         user.id,
          email:      user.email,
          full_name:  user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          avatar_url: user.user_metadata?.avatar_url || null,
          role:       'creator',
          plan:       isHardcodedAdmin ? 'promax' : 'free',
          is_admin:   isHardcodedAdmin,
        }
    : null

  return (
    <AuthContext.Provider value={{ user: fullUser, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
