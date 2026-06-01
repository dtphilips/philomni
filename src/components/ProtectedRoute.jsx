import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Only show the spinner if we have no user AND auth is still resolving.
  // If we already know a user is logged in, render immediately even while
  // the profile is loading in the background.
  if (loading && !user) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0a0a0a', flexDirection: 'column', gap: '16px',
      }}>
        <div style={{
          width: '40px', height: '40px',
          border: '3px solid #1a1a2e',
          borderTop: '3px solid #8b5cf6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: '#8b5cf6', fontSize: '14px', margin: 0 }}>Loading Philomni...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // Not signed in — redirect to /login and remember where they wanted to go
  if (!user) {
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(location.pathname)}`} replace />
  }

  return children
}

export default ProtectedRoute
