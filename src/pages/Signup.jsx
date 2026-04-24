import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function Signup() {
  const [step, setStep] = useState('form'); // form | verify
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/onboarding`,
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.user) {
        await supabase.from('users').upsert({
          id: data.user.id,
          email,
          full_name: fullName,
          role: 'member',
          plan: 'free',
          created_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      }

      if (data.session) {
        navigate('/onboarding');
      } else {
        setStep('verify');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/onboarding` },
    });
    if (error) toast.error('Google sign-up failed');
  };

  if (step === 'verify') {
    return (
      <div
        className="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
        style={{ background: '#07070f' }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full"
            style={{ background: 'radial-gradient(circle at 60% 40%, rgba(124,58,237,0.18) 0%, transparent 65%)' }}
          />
          <div
            className="absolute -bottom-32 -left-32 w-[600px] h-[600px] rounded-full"
            style={{ background: 'radial-gradient(circle at 40% 60%, rgba(59,130,246,0.12) 0%, transparent 65%)' }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-[420px]"
        >
          <div
            className="rounded-2xl p-10 text-center"
            style={{
              background: 'rgba(255,255,255,0.035)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 32px 80px rgba(0,0,0,0.6)',
            }}
          >
            <div
              className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }}
            >
              <Mail className="w-8 h-8" style={{ color: '#a78bfa' }} />
            </div>
            <h2 className="text-xl font-bold text-white mb-3">Check your inbox</h2>
            <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
              We sent a confirmation link to
            </p>
            <p className="text-sm font-semibold mb-6" style={{ color: '#a78bfa' }}>{email}</p>
            <p className="text-xs mb-8" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Click the link in the email to activate your account and start your Philomni journey.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="auth-btn-secondary"
            >
              Back to sign in
            </button>
          </div>
        </motion.div>

        <SharedStyles />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
      style={{ background: '#07070f' }}
    >
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle at 60% 40%, rgba(124,58,237,0.18) 0%, transparent 65%)' }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle at 40% 60%, rgba(59,130,246,0.12) 0%, transparent 65%)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)' }}
        />
      </div>

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[420px]"
      >
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.035)',
            border: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 32px 80px rgba(0,0,0,0.6)',
          }}
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{
                background: 'transparent',
                boxShadow: '0 0 32px rgba(124,58,237,0.45), 0 4px 16px rgba(0,0,0,0.4)',
              }}
            >
              <img src="/logo_v2.svg" alt="Philomni" className="w-14 h-14 rounded-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Join Philomni</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Brilliance Deserves a Home.
            </p>
          </div>

          {/* Google — disabled until OAuth is configured */}
          <div
            className="auth-btn-secondary"
            style={{ opacity: 0.4, cursor: 'not-allowed', userSelect: 'none' }}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign up with Google
            <span style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', marginLeft: '4px' }}>
              Coming soon
            </span>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div
                className="flex items-start gap-2 p-3 rounded-xl text-sm"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#f87171' }}
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>Full name</label>
              <input
                className="auth-input"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>Email</label>
              <input
                className="auth-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>Password</label>
              <div className="relative">
                <input
                  className="auth-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  style={{ paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength dots */}
              {password.length > 0 && (
                <div className="flex gap-1 pt-0.5">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className="flex-1 h-0.5 rounded-full transition-all duration-300"
                      style={{
                        background:
                          password.length >= i * 3
                            ? i <= 1 ? '#ef4444' : i <= 2 ? '#f59e0b' : i <= 3 ? '#3b82f6' : '#22c55e'
                            : 'rgba(255,255,255,0.1)',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="auth-btn-primary mt-1">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create account'}
            </button>
          </form>

          <p className="text-center text-xs mt-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
            By signing up you agree to our{' '}
            <Link to="/terms" style={{ color: 'rgba(255,255,255,0.45)' }} className="underline">Terms</Link>
            {' '}and{' '}
            <Link to="/privacy" style={{ color: 'rgba(255,255,255,0.45)' }} className="underline">Privacy Policy</Link>.
          </p>

          <p className="text-center text-sm mt-5" style={{ color: 'rgba(255,255,255,0.38)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-medium" style={{ color: '#a78bfa' }}>
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: 'rgba(255,255,255,0.18)' }}>
          Brilliance Deserves a Home.
        </p>
      </motion.div>

      <SharedStyles />
    </div>
  );
}

function SharedStyles() {
  return (
    <style>{`
      .auth-input {
        width: 100%;
        height: 44px;
        padding: 0 1rem;
        border-radius: 0.75rem;
        font-size: 0.875rem;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.09);
        color: white;
        outline: none;
        transition: border-color 0.2s;
        box-sizing: border-box;
      }
      .auth-input::placeholder { color: rgba(255,255,255,0.25); }
      .auth-input:focus { border-color: rgba(124,58,237,0.55); background: rgba(255,255,255,0.07); }
      .auth-btn-secondary {
        width: 100%;
        height: 44px;
        border-radius: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.625rem;
        font-size: 0.875rem;
        font-weight: 500;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.09);
        color: rgba(255,255,255,0.8);
        cursor: pointer;
        transition: background 0.2s, border-color 0.2s;
      }
      .auth-btn-secondary:hover { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.14); }
      .auth-btn-primary {
        width: 100%;
        height: 44px;
        border-radius: 0.75rem;
        font-size: 0.875rem;
        font-weight: 600;
        background: linear-gradient(135deg, #6d28d9 0%, #9333ea 100%);
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.2s, box-shadow 0.2s;
        box-shadow: 0 0 20px rgba(109,40,217,0.3);
      }
      .auth-btn-primary:hover:not(:disabled) { opacity: 0.88; box-shadow: 0 0 30px rgba(109,40,217,0.45); }
      .auth-btn-primary:disabled { opacity: 0.5; box-shadow: none; cursor: not-allowed; }
    `}</style>
  );
}
