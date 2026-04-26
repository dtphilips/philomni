import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async (authUser) => {
    if (!authUser) { setProfile(null); return }
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (data) {
      setProfile(data)
    } else {
      // Auto-create profile on first login
      const newProfile = {
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
        avatar_url: authUser.user_metadata?.avatar_url || null,
        role: 'creator',
        plan: 'free',
        created_at: new Date().toISOString(),
      }
      const { data: created } = await supabase.from('users').insert(newProfile).select().single()
      setProfile(created || newProfile)
    }
  }

  useEffect(() => {
    // Apply dark mode
    document.documentElement.classList.add('dark')

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      loadProfile(session?.user ?? null).finally(() => setLoading(false))
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      loadProfile(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const refreshProfile = () => loadProfile(user)

  // Merged object: auth user + db profile
  const fullUser = user && profile ? { ...user, ...profile } : null

  return (
    <AuthContext.Provider value={{ user: fullUser, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
