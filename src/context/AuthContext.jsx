import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})
export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)

      if (session?.user?.id) {
        supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            console.log('PROFILE LOADED:', data?.full_name, 'plan:', data?.plan, 'admin:', data?.is_admin)
            setProfile(data)
          })
      }
    })

    // Auth state changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] event:', event)
      setUser(session?.user ?? null)
      setLoading(false)

      if (session?.user?.id) {
        supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            console.log('PROFILE UPDATE:', data?.full_name, 'plan:', data?.plan, 'admin:', data?.is_admin)
            setProfile(data)
          })
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

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
      refreshProfile: () => {
        if (user?.id) {
          supabase.from('users').select('*').eq('id', user.id).single()
            .then(({ data }) => { if (data) setProfile(data) })
        }
      },
    }}>
      {children}
    </AuthContext.Provider>
  )
}
