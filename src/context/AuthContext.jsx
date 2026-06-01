import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

// Known admin emails — guarantee isAdmin=true + pro display before DB loads
const ADMIN_EMAILS = ['dtphilips1992@gmail.com']

const AuthContext = createContext({})
export const useAuth = () => useContext(AuthContext)

// ⚠️ CRITICAL AUTH NOTES — read before modifying:
// 1. autoRefreshToken: false in supabase.js is intentional — prevents PostgREST query lock
// 2. Manual token refresh is handled by scheduleTokenRefresh() — do not remove it
// 3. fetchProfile uses profileFetchedFor ref to prevent duplicate fetches
// 4. setLoading(false) must only be called AFTER fetchProfile completes (in finally block)
// 5. Never add window.location calls anywhere in the auth flow
export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const profileFetchedFor = useRef(null) // track which userId we last fetched for
  const refreshTimerRef   = useRef(null)

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
        console.error('[Auth] fetchProfile error:', error.message, '|', error.code)
        profileFetchedFor.current = null // allow retry
      } else if (data) {
        console.log('[Auth] profile loaded:', data.full_name, '| plan:', data.plan, '| admin:', data.is_admin)
        setProfile(data)
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

  // ── Manual token refresh (called on a timer, avoids autoRefreshToken lock) ─
  const scheduleTokenRefresh = (session) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    if (!session?.expires_at) return

    const expiresAt  = session.expires_at * 1000          // convert to ms
    const refreshAt  = expiresAt - 5 * 60 * 1000          // 5 min before expiry
    const delayMs    = Math.max(refreshAt - Date.now(), 0)

    refreshTimerRef.current = setTimeout(async () => {
      console.log('[Auth] refreshing session token...')
      const { data, error } = await supabase.auth.refreshSession()
      if (error) {
        console.error('[Auth] token refresh failed:', error.message)
        // Refresh failed — sign out gracefully rather than silently fail
        handleSignOut()
      } else if (data.session) {
        console.log('[Auth] token refreshed OK')
        scheduleTokenRefresh(data.session)
      }
    }, delayMs)
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    // 3-second absolute cap — if getSession somehow hangs, unblock the UI
    const cap = setTimeout(() => setLoading(false), 3000)

    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        clearTimeout(cap)
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
          scheduleTokenRefresh(session)
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
      console.log('[Auth] event:', event, '| user:', session?.user?.email ?? 'none')

      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        profileFetchedFor.current = null
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
        return
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUser(session.user)
          if (event === 'TOKEN_REFRESHED') scheduleTokenRefresh(session)
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
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sign out ──────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    setUser(null)
    setProfile(null)
    profileFetchedFor.current = null
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
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
