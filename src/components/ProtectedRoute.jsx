import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';

const Spinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
  </div>
);

export default function ProtectedRoute({ unauthenticatedElement = null }) {
  const { isAuthenticated, DEV_MODE } = useAuth();
  // Give auth state up to 1.5 s to settle after a fresh login before
  // redirecting — prevents a flash-redirect race when onAuthStateChange
  // hasn't fired yet but Supabase session is already valid.
  const [settling, setSettling] = useState(!isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) { setSettling(false); return; }
    const t = setTimeout(() => setSettling(false), 1500);
    return () => clearTimeout(t);
  }, [isAuthenticated]);

  if (DEV_MODE) return <Outlet />;
  if (settling) return <Spinner />;
  if (!isAuthenticated) return unauthenticatedElement;
  return <Outlet />;
}
