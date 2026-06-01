import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})
export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = (userId) => {
    supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        console.log('PROFILE LOADED:', data?.full_name, 'plan:', data?.plan, 'admin:', data?.is_admin, 'error:', error?.message)
        if (data) setProfile(data)   // Only update if we actually got data — never overwrite with null
      })
      .catch(err => console.error('Profile fetch error:', err))
  }

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
      if (session?.user?.id) fetchProfile(session.user.id)
    })

    // Auth state changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] event:', event)
      setUser(session?.user ?? null)
      setLoading(false)
      if (session?.user?.id) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)  // Only clear profile on explicit sign-out
      }
    })

    return () => subscription.unsubscribe()
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
