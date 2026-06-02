import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

// Known admin emails — guarantee isAdmin=true + pro display before DB loads
const ADMIN_EMAILS = ['dtphilips1992@gmail.com']

const AuthContext = createContext({})
export const useAuth = () => useContext(AuthContext)

// ⚠️ CRITICAL AUTH NOTES — read before modifying:
// 1. autoRefreshToken: true in supabase.js — Supabase auto-refreshes the token.
//    (If signed-in queries hang on load, add a no-op lock — see supabase.js note.)
// 2. fetchProfile uses profileFetchedFor ref to prevent duplicate fetches
// 3. setLoading(false) must only be called AFTER fetchProfile completes (in finally block)
// 4. Never add window.location calls anywhere in the auth flow (except signOut)
export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const profileFetchedFor = useRef(null) // track which userId we last fetched for
  const profileRef        = useRef(null) // mirror of profile state for stable reads in listeners

  // ── Profile fetch (background, never blocks UI) ───────────────────────────
  const fetchProfile = async (userId) => {
    if (!userId || profileFetchedFor.current === userId) return
    profileFetchedFor.current = userId
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      if (error) {
        console.error('[Auth Profile ERROR]', error)
        console.error('[Auth] fetchProfile error:', error.message, '|', error.code)
        profileFetchedFor.current = null // allow retry
      } else if (data) {
        console.log('[Auth Profile]', data?.full_name, data?.plan)
        console.log('[Auth] profile loaded:', data.full_name, '| plan:', data.plan, '| admin:', data.is_admin)
        setProfile(data)
        profileRef.current = data
      } else {
        console.warn('[Auth] no public.users row for', userId)
      }
    } catch (e) {
      console.error('[Auth] fetchProfile threw:', e.message)
      profileFetchedFor.current = null
    } finally {
      // Stop loading only AFTER profile is set (or failed) — so the sidebar
      // never renders with profile=null showing "Free"/email.
      setLoading(false)
    }
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    console.log('[Auth Boot] starting')
    // 3-second absolute cap — if getSession somehow hangs, unblock the UI
    const cap = setTimeout(() => setLoading(false), 3000)

    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        clearTimeout(cap)
        console.log('[Auth getSession] session:', session?.user?.email ?? 'NO SESSION')
        if (error) {
          console.error('[Auth] getSession error:', error.message)
          setLoading(false)
          return
        }
        if (session?.user) {
          // Check if the access token is expired
          const now       = Math.floor(Date.now() / 1000)
          const expiresAt = session.expires_at ?? 0
          if (expiresAt > 0 && now > expiresAt) {
            // Token expired — sign out silently instead of making bad queries
            console.warn('[Auth] stored token is expired, signing out')
            supabase.auth.signOut()
            setLoading(false)
            return
          }
          setUser(session.user)
          fetchProfile(session.user.id)  // its finally block calls setLoading(false) once profile is set
        } else {
          setLoading(false)
        }
      })
      .catch(err => {
        clearTimeout(cap)
        console.error('[Auth] getSession threw:', err)
        setLoading(false)
      })

    // onAuthStateChange covers sign-in / sign-out / token refresh events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth Event]', event, session?.user?.email ?? 'NO SESSION')

      if (event === 'SIGNED_OUT') {
        console.log('[Auth] setUser(null) called here')
        setUser(null)
        console.log('[Auth] setProfile(null) called here')
        setProfile(null)
        profileRef.current = null
        profileFetchedFor.current = null
        return
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUser(session.user)
          // Only fetch profile if we don't already have it for this user
          if (profileFetchedFor.current !== session.user.id) {
            fetchProfile(session.user.id)
          }
        }
      }
    })

    return () => {
      clearTimeout(cap)
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sign out ──────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    console.log('[Auth] setUser(null) called here')
    setUser(null)
    console.log('[Auth] setProfile(null) called here')
    setProfile(null)
    profileRef.current = null
    profileFetchedFor.current = null
    localStorage.clear()
    sessionStorage.clear()
    await supabase.auth.signOut()
    window.location.replace('/login')
  }

  // ── Merged user (profile fields overlaid on auth user) ───────────────────
  const mergedUser = user ? { ...user, ...(profile ?? {}) } : null

  // isAdmin: use DB value if available, fall back to hardcoded list
  const isAdmin = profile?.is_admin === true ||
    ADMIN_EMAILS.includes((user?.email ?? '').toLowerCase())

  return (
    <AuthContext.Provider value={{
      user:    mergedUser,
      profile,
      loading,
      signOut: handleSignOut,
      isAdmin,
      isPro:    isAdmin || ['pro', 'promax'].includes(profile?.plan),
      isProMax: isAdmin || profile?.plan === 'promax',
      refreshProfile: () => {
        profileFetchedFor.current = null
        if (user?.id) fetchProfile(user.id)
      },
    }}>
      {children}
    </AuthContext.Provider>
  )
}
