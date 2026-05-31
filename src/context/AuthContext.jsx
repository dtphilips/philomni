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

// ── Race any promise against a ms timeout (resolves null on timeout) ──────────
const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise(resolve => setTimeout(() => resolve(null), ms)),
  ])

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(DEV_USER)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(DEV_USER)
  const [loading, setLoading] = useState(DEV_MODE ? false : true)

  // ── Fetch / auto-create profile row ───────────────────────────────────────
  const fetchProfile = async (authUser) => {
    if (!authUser) return null
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) {
        // PGRST116 = row not found — create it
        if (error.code === 'PGRST116') {
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
            .from('users').insert(newProfile).select().single()
          return created || newProfile
        }
        console.error('[Auth] fetchProfile error:', error.message)
        return null
      }
      return data
    } catch (err) {
      console.error('[Auth] fetchProfile threw:', err.message)
      return null
    }
  }

  // ── Boot — resolves loading state as fast as possible ─────────────────────
  // Profile is NOT awaited here; it loads lazily in the effect below.
  // This guarantees loading=false fires in milliseconds, not seconds.
  useEffect(() => {
    document.documentElement.classList.add('dark')
    if (DEV_MODE) return

    let mounted = true

    // Nuclear fallback — forces loading=false after 5 s no matter what
    const nuclear = setTimeout(() => {
      console.warn('[Auth] 5 s nuclear timer fired — forcing loading=false')
      if (mounted) setLoading(false)
    }, 5000)

    const done = () => {
      clearTimeout(nuclear)
      if (mounted) setLoading(false)
    }

    // ── Initial session ────────────────────────────────────────────────────
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return
        setSession(session)
        setUser(session?.user ?? null)
        if (!session?.user) setProfile(null)
      } catch (err) {
        console.error('[Auth] initAuth error:', err.message)
      } finally {
        done()  // ← always fires; profile loads separately
      }
    }

    initAuth()

    // ── Live auth state changes ────────────────────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event)
        if (!mounted) return
        try {
          setSession(session)
          setUser(session?.user ?? null)
          if (!session?.user) setProfile(null)
        } catch (err) {
          console.error('[Auth] onAuthStateChange error:', err.message)
        } finally {
          done()  // ← always fires; profile loads separately
        }
      }
    )

    return () => {
      mounted = false
      clearTimeout(nuclear)
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Lazy profile loader — runs after user is known, never blocks loading ──
  useEffect(() => {
    if (DEV_MODE) return
    if (!user?.id) { setProfile(null); return }
    withTimeout(fetchProfile(user), 3000)
      .then(prof => setProfile(prof))
      .catch(() => setProfile(null))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // ── Auth actions ──────────────────────────────────────────────────────────
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
      // Clear React state first — UI updates immediately
      setUser(null)
      setSession(null)
      setProfile(null)
      setLoading(false)
      // Clear all storage
      localStorage.clear()
      sessionStorage.clear()
      // Sign out from Supabase (non-blocking for UI)
      await supabase.auth.signOut()
    } catch (err) {
      console.error('[Auth] signOut error:', err.message)
    } finally {
      // Hard redirect — clears any in-memory state no matter what
      window.location.replace('/login')
    }
  }

  const refreshProfile = async () => {
    if (!user) return
    const prof = await withTimeout(fetchProfile(user), 3000)
    if (prof) setProfile(prof)
  }

  // ── Computed values ───────────────────────────────────────────────────────
  const isHardcodedAdmin = user
    ? ADMIN_EMAILS.includes((user.email || '').toLowerCase())
    : false

  const fullUser = user
    ? profile
      ? {
          ...user,
          ...profile,
          is_admin: profile.is_admin === true || isHardcodedAdmin,
          plan: (profile.is_admin === true || isHardcodedAdmin) ? 'promax' : (profile.plan || 'free'),
        }
      : {
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
