import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})
export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId) => {
    try {
      // Use maybeSingle() — returns null (not an error) when 0 rows found
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      if (error) {
        console.error('fetchProfile error:', error.message, '| code:', error.code)
      } else if (data) {
        console.log('Profile loaded:', data.full_name, '| plan:', data.plan, '| admin:', data.is_admin)
        setProfile(data)
      } else {
        console.warn('fetchProfile: no row in public.users for auth id', userId)
      }
    } catch (e) {
      console.error('fetchProfile unexpected error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Absolute fallback — fires after 5 s regardless of network state.
    // NOT cleared on getSession success so it always covers fetchProfile too.
    const timeout = setTimeout(() => setLoading(false), 5000)

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id) // setLoading(false) in finally
        } else {
          setLoading(false)
        }
      })
      .catch(err => {
        console.error('getSession error:', err)
        setLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    // Only cancel the timeout on unmount — never cancel it early
    return () => { subscription.unsubscribe(); clearTimeout(timeout) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = async () => {
    localStorage.clear()
    sessionStorage.clear()
    await supabase.auth.signOut()
    window.location.replace('/login')
  }

  // Merge profile data into user so that user.full_name, user.avatar_url,
  // user.plan, user.is_admin etc. all work across the codebase without changes.
  const mergedUser = user
    ? { ...user, ...(profile ?? {}) }
    : null

  return (
    <AuthContext.Provider value={{
      user: mergedUser,
      profile,
      loading,
      signOut,
      isAdmin:  profile?.is_admin === true,
      isPro:    profile?.plan === 'pro' || profile?.plan === 'promax' || profile?.is_admin === true,
      isProMax: profile?.plan === 'promax' || profile?.is_admin === true,
      refreshProfile: () => { if (user?.id) fetchProfile(user.id) },
    }}>
      {children}
    </AuthContext.Provider>
  )
}
