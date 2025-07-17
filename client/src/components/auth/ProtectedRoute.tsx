/**
 * Protected Route Component
 * Provides route protection based on authentication and role-based access control
 */

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoginForm } from './LoginForm';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: Array<'Admin' | 'Manager' | 'Viewer'>;
  fallback?: React.ReactNode;
  showAccessDenied?: boolean;
}

/**
 * Role-based access control guard component
 */
export const RoleGuard: React.FC<{
  allowedRoles: Array<'Admin' | 'Manager' | 'Viewer'>;
  userRole: 'Admin' | 'Manager' | 'Viewer';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ allowedRoles, userRole, children, fallback = null }) => {
  const hasPermission = allowedRoles.includes(userRole);
  
  if (!hasPermission) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

/**
 * Access denied component
 */
const AccessDenied: React.FC<{
  requiredRoles: string[];
  userRole: string;
  onGoBack?: () => void;
}> = ({ requiredRoles, userRole, onGoBack }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <Shield className="h-6 w-6 text-red-600" />
        </div>
        <CardTitle className="text-xl font-bold text-red-600">Access Denied</CardTitle>
        <CardDescription>
          You don't have permission to access this resource
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-gray-50 p-4 text-sm">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Access Requirements:</p>
              <p className="mt-1 text-gray-600">
                This resource requires one of the following roles: {requiredRoles.join(', ')}
              </p>
              <p className="mt-2 text-gray-600">
                Your current role: <span className="font-medium">{userRole}</span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          <p>If you believe you should have access to this resource, please contact your administrator.</p>
        </div>

        {onGoBack && (
          <Button onClick={onGoBack} className="w-full" variant="outline">
            Go Back
          </Button>
        )}
      </CardContent>
    </Card>
  </div>
);

/**
 * Loading component
 */
const LoadingAuth: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
      <p className="mt-2 text-sm text-gray-600">Loading...</p>
    </div>
  </div>
);

/**
 * Login required component
 */
const LoginRequired: React.FC<{ onLoginSuccess?: () => void }> = ({ onLoginSuccess }) => (
  <div className="flex items-center justify-center min-h-[400px] p-4">
    <div className="w-full max-w-md">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Authentication Required</h2>
        <p className="mt-2 text-sm text-gray-600">
          Please sign in to access this resource
        </p>
      </div>
      <LoginForm onSuccess={onLoginSuccess} />
    </div>
  </div>
);

/**
 * Main ProtectedRoute component
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  fallback,
  showAccessDenied = true,
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  console.log('🔍 ProtectedRoute: Auth state:', { user: !!user, isLoading, isAuthenticated });

  // Show loading while authentication state is being determined
  if (isLoading) {
    console.log('🔍 ProtectedRoute: Showing loading state');
    return fallback || <LoadingAuth />;
  }

  // Show login form if user is not authenticated
  if (!isAuthenticated || !user) {
    console.log('🔍 ProtectedRoute: User not authenticated, showing login form');
    return fallback || <LoginRequired />;
  }

  // Check role-based permissions if required roles are specified
  if (requiredRoles.length > 0) {
    const hasPermission = requiredRoles.includes(user.role);
    
    if (!hasPermission) {
      if (showAccessDenied) {
        return (
          <AccessDenied
            requiredRoles={requiredRoles}
            userRole={user.role}
            onGoBack={() => window.history.back()}
          />
        );
      }
      return fallback || null;
    }
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
};

/**
 * Hook for role-based conditional rendering
 */
export const usePermissions = () => {
  const { user } = useAuth();

  const hasRole = (roles: Array<'Admin' | 'Manager' | 'Viewer'>): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isAdmin = (): boolean => hasRole(['Admin']);
  const isManagerOrAdmin = (): boolean => hasRole(['Admin', 'Manager']);
  const canEdit = (): boolean => hasRole(['Admin', 'Manager']);
  const canDelete = (): boolean => hasRole(['Admin']);
  const canViewAdmin = (): boolean => hasRole(['Admin']);

  return {
    user,
    hasRole,
    isAdmin,
    isManagerOrAdmin,
    canEdit,
    canDelete,
    canViewAdmin,
  };
};

/**
 * Higher-order component for protecting components
 */
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles?: Array<'Admin' | 'Manager' | 'Viewer'>
) => {
  return (props: P) => (
    <ProtectedRoute requiredRoles={requiredRoles}>
      <Component {...props} />
    </ProtectedRoute>
  );
};