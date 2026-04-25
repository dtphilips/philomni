import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const hasStoredToken = () => {
  try {
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

export default function ProtectedRoute({ unauthenticatedElement = null }) {
  const { isAuthenticated, authChecked, DEV_MODE } = useAuth();

  if (DEV_MODE) return <Outlet />;

  // If a token exists in localStorage, render immediately — don't flash the
  // spinner or redirect while onAuthStateChange is still resolving.
  if (!authChecked && hasStoredToken()) return <Outlet />;

  // No token — wait for async auth check before deciding to redirect
  if (!authChecked) return <Spinner />;

  if (!isAuthenticated) return unauthenticatedElement;
  return <Outlet />;
}
