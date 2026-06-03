import { createContext, useContext, useEffect, useRef, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'

// Known admin emails — guarantee isAdmin=true + pro display before DB loads
const ADMIN_EMAILS = ['dtphilips1992@gmail.com']

const AuthContext = createContext({})
export const useAuth = () => useContext(AuthContext)

// ⚠️ CRITICAL AUTH NOTES — read before modifying:
// 1. supabase.js: autoRefreshToken:true + no-op `lock`. KEEP the no-op lock —
//    it prevents the cross-tab Navigator Lock deadlock. autoRefreshToken:true
//    keeps JWTs fresh so long-idle sessions don't SIGNED_OUT on tab return.
// 2. setUserStable keeps the SAME user reference when the id is unchanged.
//    Supabase RE-EMITS SIGNED_IN on tab refocus; changing the ref triggered an
//    app-wide re-render/re-fetch storm (every page reset / flashed loading).
//    Do not replace it with a plain setUser(session.user).
// 3. The context value AND mergedUser are memoized so consumers don't re-render
//    on every provider render. Keep the useMemo wrappers.
// 4. fetchProfile only runs when we don't already hold this user's profile.
// 5. Never add window.location calls in the auth flow (except signOut).
export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const profileFetchedFor = useRef(null) // which userId we last fetched for
  const profileRef        = useRef(null) // mirror of profile for stable reads in listeners

  // Update user only when it actually changes — keeps a stable reference across
  // the duplicate SIGNED_IN events Supabase fires on tab refocus.
  const setUserStable = (nextUser) => {
    setUser(prev => (prev?.id === nextUser?.id ? prev : nextUser))
  }

  // ── Profile fetch (background, never blocks UI) ───────────────────────────
  const fetchProfile = async (userId) => {
    if (!userId || profileFetchedFor.current === userId) return
    profileFetchedFor.current = userId

    const controller = new AbortController()
    const timeoutId = setTimeout(() => { controller.abort(); setLoading(false) }, 5000)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .abortSignal(controller.signal)
        .maybeSingle()
      clearTimeout(timeoutId)

      if (error) {
        console.error('fetchProfile error:', error.message, error.code)
        profileFetchedFor.current = null // allow retry
      } else if (data) {
        setProfile(data)
        profileRef.current = data
      }
    } catch (e) {
      clearTimeout(timeoutId)
      console.error('fetchProfile failed:', e.message)
      profileFetchedFor.current = null
    } finally {
      setLoading(false)
    }
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const cap = setTimeout(() => setLoading(false), 3000)

    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        clearTimeout(cap)
        if (error) { console.error('getSession error:', error.message); setLoading(false); return }
        if (session?.user) {
          const now       = Math.floor(Date.now() / 1000)
          const expiresAt = session.expires_at ?? 0
          if (expiresAt > 0 && now > expiresAt) {
            supabase.auth.signOut(); setLoading(false); return
          }
          setUserStable(session.user)
          fetchProfile(session.user.id)
        } else {
          setLoading(false)
        }
      })
      .catch(err => { clearTimeout(cap); console.error('getSession threw:', err); setLoading(false) })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[Auth] ${event} — user=${session?.user?.id?.slice(0,8) ?? 'none'} profile=${!!profileRef.current}`)
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        profileRef.current = null
        profileFetchedFor.current = null
        return
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUserStable(session.user) // stable ref — no re-render storm on tab refocus
          // Only fetch if we don't already hold this user's profile
          if (!profileRef.current || profileRef.current.id !== session.user.id) {
            profileFetchedFor.current = null
            fetchProfile(session.user.id)
          }
        }
      }
    })

    return () => { clearTimeout(cap); subscription.unsubscribe() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sign out ──────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    setUser(null)
    setProfile(null)
    profileRef.current = null
    profileFetchedFor.current = null
    localStorage.clear()
    sessionStorage.clear()
    await supabase.auth.signOut()
    window.location.replace('/login')
  }

  // Merged user (profile fields overlaid on auth user) — memoized so the
  // reference is stable when user/profile haven't changed.
  const mergedUser = useMemo(
    () => (user ? { ...user, ...(profile ?? {}) } : null),
    [user, profile]
  )

  const isAdmin = (profile?.is_admin === true) ||
    ADMIN_EMAILS.includes((user?.email ?? '').toLowerCase())

  // Memoized context value — only changes when the real values change, so
  // consumers don't re-render (and re-fetch) on every provider render.
  const contextValue = useMemo(() => ({
    user: mergedUser,
    profile,
    loading,
    signOut: handleSignOut,
    isAdmin,
    isPro:    isAdmin || ['pro', 'promax'].includes(profile?.plan),
    isProMax: isAdmin || profile?.plan === 'promax',
    refreshProfile: () => {
      profileFetchedFor.current = null
      profileRef.current = null
      if (user?.id) fetchProfile(user.id)
    },
  }), [mergedUser, profile, loading, isAdmin]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}
