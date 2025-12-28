// ============================================================================
// Protected Route Component
// Wraps routes that require authentication
// Redirects to login if user is not authenticated
// ============================================================================

import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // Still checking session
  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-slate-50"
        data-testid="auth-loading"
      >
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // No user - redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated - render children
  return <>{children}</>;
}


