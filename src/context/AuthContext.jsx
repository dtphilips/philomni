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
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      console.log('PROFILE LOADED:', data?.full_name, 'plan:', data?.plan, 'admin:', data?.is_admin)
      if (data) setProfile(data)
    } catch (e) {
      console.error('Profile fetch error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Absolute fallback — never block the app longer than 5s
    const timeout = setTimeout(() => setLoading(false), 5000)

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        clearTimeout(timeout)
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id)   // setLoading(false) happens in finally
        } else {
          setLoading(false)
        }
      })
      .catch(err => {
        console.error('getSession error:', err)
        clearTimeout(timeout)
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

    return () => { subscription.unsubscribe(); clearTimeout(timeout) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = async () => {
    localStorage.clear()
    sessionStorage.clear()
    await supabase.auth.signOut()
    window.location.replace('/login')
  }

  return (
    <AuthContext.Provider value={{
      user,
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
