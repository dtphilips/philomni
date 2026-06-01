import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})
export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const fetchingRef = useRef(false)

  const fetchProfile = async (userId) => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      if (error) console.error('fetchProfile DB error:', error.message)
      else if (data) {
        console.log('Profile loaded:', data.full_name, '| plan:', data.plan, '| admin:', data.is_admin)
        setProfile(data)
      } else {
        console.warn('fetchProfile: no row for', userId)
      }
    } catch (e) {
      // AbortError means the 8s fetch timeout fired (supabase.js fetchWithTimeout)
      console.error('fetchProfile error:', e.name, e.message)
    } finally {
      fetchingRef.current = false
      setLoading(false)
    }
  }

  useEffect(() => {
    // Hard stop at 10 s — matches the 8s fetch timeout + 2s buffer.
    // Prevents the spinner from showing forever if the Supabase token
    // refresh or query hangs (e.g. first load after a long absence).
    const hardStop = setTimeout(() => {
      console.warn('Auth hard stop triggered (10s)')
      setLoading(false)
    }, 10000)

    // getSession reads the stored session from localStorage synchronously
    // (no network call). Use it to set user immediately so the UI unblocks.
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error('getSession error:', error.message)
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    }).catch(err => {
      console.error('getSession threw:', err)
      setLoading(false)
    })

    // onAuthStateChange keeps the user state in sync after sign-in/out/refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event, '| user:', session?.user?.email ?? 'none')

      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }
      if (event === 'TOKEN_REFRESHED') {
        // Token refreshed — re-fetch profile in case plan/admin changed
        if (session?.user && !fetchingRef.current) {
          fetchingRef.current = false // allow re-fetch
          fetchProfile(session.user.id)
        }
        return
      }
      if (session?.user) {
        setUser(session.user)
        // Only call fetchProfile if getSession hasn't already started it
        if (!fetchingRef.current && !profile) {
          fetchProfile(session.user.id)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
      clearTimeout(hardStop)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = async () => {
    setUser(null)
    setProfile(null)
    setLoading(false)
    localStorage.clear()
    sessionStorage.clear()
    await supabase.auth.signOut()
    window.location.replace('/login')
  }

  // Merge profile into auth user so user.full_name / user.plan / user.is_admin
  // work everywhere without changes to 80+ components.
  const mergedUser = user ? { ...user, ...(profile ?? {}) } : null

  return (
    <AuthContext.Provider value={{
      user: mergedUser,
      profile,
      loading,
      signOut,
      // isAdmin: hardcoded fallback for the known admin email so the admin
      // nav shows immediately, before profile loads from the DB.
      isAdmin:  profile?.is_admin === true || mergedUser?.email === 'dtphilips1992@gmail.com',
      isPro:    ['pro', 'promax'].includes(profile?.plan) || profile?.is_admin === true,
      isProMax: profile?.plan === 'promax' || profile?.is_admin === true,
      refreshProfile: () => { fetchingRef.current = false; if (user?.id) fetchProfile(user.id) },
    }}>
      {children}
    </AuthContext.Provider>
  )
}
