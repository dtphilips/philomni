import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [mode, setMode]       = useState('signin') // signin | signup
  // Read returnUrl from query string so ProtectedRoute can send users back
  const returnUrl = new URLSearchParams(window.location.search).get('returnUrl') || '/'
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'signin') {
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email:    email.trim(),
        password: password,
      })

      if (signInErr) {
        setError(signInErr.message)
        setLoading(false)
        return
      }

      if (data.session) {
        window.location.replace(returnUrl)
      }
    } else {
      // Sign-up
      if (!fullName.trim()) {
        setError('Full name is required')
        setLoading(false)
        return
      }

      const { error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })

      if (signUpErr) {
        setError(signUpErr.message)
      } else {
        setError('Check your email to confirm your account.')
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">P</div>
          <h1 className="text-2xl font-bold text-foreground">Philomni</h1>
          <p className="text-muted-foreground text-sm mt-1">The global creator platform</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          {/* Toggle */}
          <div className="flex rounded-xl bg-muted p-1 mb-6">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'signin' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'signup' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>

            {error && (
              <p className={`text-sm px-3 py-2 rounded-lg ${error.includes('Check') ? 'text-emerald-400 bg-emerald-500/10' : 'text-destructive bg-destructive/10'}`}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Signing in…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
