import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';
import { RefreshCw } from 'lucide-react';

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-500 mb-3" />
        <p className="text-sm font-medium">Verifying Session Security...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to respective dashboard if authorized elsewhere
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'TEACHER') return <Navigate to="/teacher/dashboard" replace />;
    if (user.role === 'STUDENT') return <Navigate to="/student/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
