import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const Spinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
  </div>
);

export default function ProtectedRoute({ unauthenticatedElement = null }) {
  const { isAuthenticated, isLoadingAuth, authChecked, DEV_MODE } = useAuth();

  // Dev mode: always authenticated
  if (DEV_MODE) return <Outlet />;

  // Still checking
  if (isLoadingAuth || !authChecked) return <Spinner />;

  // Not authenticated
  if (!isAuthenticated) return unauthenticatedElement;

  return <Outlet />;
}
