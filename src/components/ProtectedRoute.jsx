import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// ── PublicRoute — redirects authenticated users away from login/signup ────────
export function PublicRoute({ children }) {
  const { user, loading } = useAuth()

  // While auth is resolving, render nothing (avoids flash of login page)
  if (loading) return null

  // Already logged in → go to feed
  if (user) {
    window.location.href = '/'
    return null
  }

  return children
}

const Spinner = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#0a0a0a',
    flexDirection: 'column',
    gap: '16px',
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid #1a1a2e',
      borderTop: '3px solid #8b5cf6',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    <p style={{ color: '#8b5cf6', fontSize: '14px', margin: 0 }}>
      Loading Philomni...
    </p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
)

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <Spinner />
  if (!user)   return <Navigate to="/login" replace />
  return children
}
