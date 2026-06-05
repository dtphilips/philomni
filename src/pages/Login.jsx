import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, RefreshCw } from 'lucide-react'

// ⚠️ CRITICAL: Never use window.location.replace() or window.location.href after login.
// Always use React Router navigate() — hard reloads destroy the in-memory Supabase session
// before it persists to localStorage, causing auth to fail silently on reload.
// The useEffect watching `user` handles all post-login navigation automatically.

// ── Password utilities ────────────────────────────────────────────────────────

const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%'

const generatePassword = () => {
  let pwd = ''
  // Guarantee at least one of each required type
  pwd += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
  pwd += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
  pwd += '0123456789'[Math.floor(Math.random() * 10)]
  pwd += '!@#$%'[Math.floor(Math.random() * 5)]
  // Fill remaining 8 chars
  for (let i = 0; i < 8; i++) {
    pwd += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  // Fisher-Yates shuffle
  const arr = pwd.split('')
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.join('')
}

const getPasswordStrength = (pwd) => {
  let score = 0
  if (pwd.length >= 8)            score++
  if (pwd.length >= 12)           score++
  if (/[A-Z]/.test(pwd))          score++
  if (/[0-9]/.test(pwd))          score++
  if (/[^A-Za-z0-9]/.test(pwd))   score++
  return score
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
const STRENGTH_COLORS = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500']

// ── Component ─────────────────────────────────────────────────────────────────

export default function Login() {
  const [mode, setMode]         = useState('signin') // 'signin' | 'signup'
  const returnUrl               = new URLSearchParams(window.location.search).get('returnUrl') || '/'
  const navigate                = useNavigate()
  const { user }                = useAuth()

  // Form fields
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [fullName,  setFullName]  = useState('')
  const [username,  setUsername]  = useState('')

  // UI state
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPassword,         setShowPassword]         = useState(false)
  const [showSuggestPassword,  setShowSuggestPassword]  = useState(false)
  const [suggestedPassword,    setSuggestedPassword]    = useState('')

  const pwdInputRef = useRef(null)

  // Navigate once auth session lands
  useEffect(() => {
    if (user) navigate(returnUrl, { replace: true })
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset extra fields when toggling modes
  const switchMode = (next) => {
    setMode(next)
    setError('')
    setPassword('')
    setShowPassword(false)
    setShowSuggestPassword(false)
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'signin') {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email:    email.trim(),
        password: password,
      })
      if (signInErr) { setError(signInErr.message); setLoading(false); return }
      // Navigation handled by useEffect above
      setLoading(false)
    } else {
      // Sign-up validation
      if (!fullName.trim()) { setError('Full name is required'); setLoading(false); return }
      if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return }

      const resolvedUsername = username.trim() ||
        fullName.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            username:  resolvedUsername,
          },
        },
      })

      if (signUpErr) {
        setError(signUpErr.message)
        setLoading(false)
        return
      }

      // Insert a profile row immediately (handles cases where the DB trigger is absent)
      if (data?.user) {
        await supabase.from('users').upsert({
          id:         data.user.id,
          email:      email.trim(),
          full_name:  fullName.trim(),
          username:   resolvedUsername,
          plan:       'free',
          role:       'creator',
          created_at: new Date().toISOString(),
        }, { onConflict: 'id', ignoreDuplicates: true })
      }

      setError('Check your email to confirm your account.')
      setLoading(false)
    }
  }

  // ── Password suggestion helpers ───────────────────────────────────────────

  const handlePasswordFocus = () => {
    if (mode !== 'signup') return
    setSuggestedPassword(generatePassword())
    setShowSuggestPassword(true)
  }

  const handlePasswordBlur = () => {
    // Small delay so the "Use" button click fires before the popup closes
    setTimeout(() => setShowSuggestPassword(false), 200)
  }

  const useSuggestedPassword = () => {
    setPassword(suggestedPassword)
    setShowPassword(true)       // show it so the user can see / copy
    setShowSuggestPassword(false)
    pwdInputRef.current?.focus()
  }

  const refreshSuggestion = (e) => {
    e.stopPropagation()
    setSuggestedPassword(generatePassword())
  }

  const strength = getPasswordStrength(password)

  // ── Render ────────────────────────────────────────────────────────────────

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
            {['signin', 'signup'].map(m => (
              <button key={m} onClick={() => switchMode(m)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">

            {/* Full Name (signup only) */}
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

            {/* Username (signup only) */}
            {mode === 'signup' && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="yourname"
                    maxLength={30}
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Letters, numbers and underscores only</p>
              </div>
            )}

            {/* Email */}
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

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Password</label>
              <div className="relative">
                <input
                  ref={pwdInputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={handlePasswordFocus}
                  onBlur={handlePasswordBlur}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-3 py-2.5 pr-10 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
                {/* Show / hide toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>

                {/* Suggested password popup */}
                {mode === 'signup' && showSuggestPassword && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-xl p-3 shadow-lg z-50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-foreground">Suggested password</p>
                      <button type="button" onClick={refreshSuggestion}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="Generate new suggestion">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-primary flex-1 truncate bg-muted px-2 py-1 rounded-lg">
                        {suggestedPassword}
                      </code>
                      <button
                        type="button"
                        onMouseDown={e => e.preventDefault()} // prevent blur firing first
                        onClick={useSuggestedPassword}
                        className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors flex-shrink-0 font-semibold"
                      >
                        Use
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      💡 Save this in your notes or a password manager
                    </p>
                  </div>
                )}
              </div>

              {/* Strength indicator (signup only, when password has content) */}
              {mode === 'signup' && password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= strength ? STRENGTH_COLORS[strength] : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs transition-colors ${
                    strength <= 1 ? 'text-red-500'
                    : strength === 2 ? 'text-orange-500'
                    : strength === 3 ? 'text-yellow-500'
                    : 'text-emerald-500'
                  }`}>
                    {STRENGTH_LABELS[strength]}
                  </p>
                </div>
              )}
            </div>

            {/* Error / success message */}
            {error && (
              <p className={`text-sm px-3 py-2 rounded-lg ${
                error.includes('Check') ? 'text-emerald-400 bg-emerald-500/10' : 'text-destructive bg-destructive/10'
              }`}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {loading
                ? (mode === 'signin' ? 'Signing in…' : 'Creating account…')
                : (mode === 'signin' ? 'Sign In' : 'Create Account')}
            </button>

          </form>
        </div>
      </div>
    </div>
  )
}
