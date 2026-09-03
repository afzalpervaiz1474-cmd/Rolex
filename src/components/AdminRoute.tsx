import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './ui/LoadingScreen';
import Button from './ui/Button';

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading, profile, profileLoading, isAdmin } = useAuth();
  const location = useLocation();
  if (loading || (user && profileLoading && !profile)) return <LoadingScreen label="Verifying access" />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="glass max-w-md rounded-md p-10 text-center">
          <p className="eyebrow">Restricted</p>
          <h1 className="mt-4 font-display text-4xl">Admin access required</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            This area is reserved for AETHER staff. If you believe you should have access, contact the concierge team.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button to="/" variant="secondary">
              Return home
            </Button>
            <Button to="/account">My account</Button>
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
