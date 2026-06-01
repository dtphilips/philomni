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
      console.log('fetchProfile start for:', userId)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('fetchProfile error:', error.message, error.code)
      } else if (data) {
        console.log('Profile loaded:', data.full_name, '| plan:', data.plan)
        setProfile(data)
      } else {
        console.warn('No profile row found for:', userId)
      }
    } catch (e) {
      console.error('fetchProfile exception:', e)
    } finally {
      fetchingRef.current = false
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 8000)

    // ONLY use onAuthStateChange — remove getSession() race condition
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event, '| user:', session?.user?.id ?? 'none')

      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const signOut = async () => {
    localStorage.clear()
    sessionStorage.clear()
    await supabase.auth.signOut()
    window.location.replace('/login')
  }

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
      isPro:    ['pro','promax'].includes(profile?.plan) || profile?.is_admin === true,
      isProMax: profile?.plan === 'promax' || profile?.is_admin === true,
      refreshProfile: () => { if (user?.id) fetchProfile(user.id) },
    }}>
      {children}
    </AuthContext.Provider>
  )
}
