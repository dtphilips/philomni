import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})
export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const fetchingRef = useRef(false)

  const fetchProfile = async (userId) => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      if (data) setProfile(data)
    } catch (e) {
      console.error('fetchProfile error:', e)
    } finally {
      fetchingRef.current = false
      setLoading(false)
    }
  }

  useEffect(() => {
    // Hard stop after 3 seconds NO MATTER WHAT
    const hardStop = setTimeout(() => {
      console.warn('Auth hard stop triggered')
      setLoading(false)
    }, 3000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id)
      }
    })

    return () => {
      subscription.unsubscribe()
      clearTimeout(hardStop)
    }
  }, [])

  const signOut = async () => {
    setUser(null)
    setProfile(null)
    setLoading(false)
    localStorage.clear()
    sessionStorage.clear()
    await supabase.auth.signOut()
    window.location.replace('/login')
  }

  const mergedUser = user ? { ...user, ...(profile ?? {}) } : null

  return (
    <AuthContext.Provider value={{
      user: mergedUser,
      profile,
      loading,
      signOut,
      isAdmin: profile?.is_admin === true || user?.email === 'dtphilips1992@gmail.com',
      isPro: ['pro','promax'].includes(profile?.plan) || profile?.is_admin === true,
      isProMax: profile?.plan === 'promax' || profile?.is_admin === true,
      refreshProfile: () => { if (user?.id) fetchProfile(user.id) },
    }}>
      {children}
    </AuthContext.Provider>
  )
}
