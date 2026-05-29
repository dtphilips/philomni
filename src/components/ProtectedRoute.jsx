import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

// Check for a stored session using the custom storageKey ('philomni-auth')
// and the legacy default Supabase key format as a fallback.
const hasStoredToken = () => {
  try {
    if (localStorage.getItem('philomni-auth')) return true;
    return Object.keys(localStorage).some(
      k => k.startsWith('sb-') && k.endsWith('-auth-token')
    );
  } catch {
    return false;
  }
};

const Spinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <img src="/logo_v2.svg" alt="Philomni" className="w-10 h-10 rounded-xl opacity-80" />
      <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  </div>
);

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // If a token exists in localStorage, render immediately while auth resolves
  // so there is no flash-redirect to /login on navigation or page refresh.
  if (loading && hasStoredToken()) return children;

  if (loading) return <Spinner />;

  if (!user) return <Navigate to="/login" replace />;
  return children;
}
