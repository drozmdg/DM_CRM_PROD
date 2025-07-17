/**
 * No-Auth usePermissions Hook
 * Simplified version that grants all permissions without authentication
 */

import { useCallback } from 'react';

interface UsePermissionsReturn {
  canViewCustomer: (customerId: string) => Promise<boolean>;
  canEditCustomer: (customerId: string) => Promise<boolean>;
  getPermissionSync: (customerId: string) => { canView: boolean; canEdit: boolean; isAssigned: boolean };
  isAdmin: boolean;
  getAllowedCustomerIds: () => Promise<string[]>;
  getAssignedCustomerIds: () => Promise<string[]>;
  refreshPermissions: () => Promise<void>;
  clearCache: () => void;
}

export const usePermissions = (): UsePermissionsReturn => {
  // No authentication - grant all permissions
  const isAdmin = true;

  const canViewCustomer = useCallback(async (customerId: string): Promise<boolean> => {
    return true; // Allow all customers to be viewed
  }, []);

  const canEditCustomer = useCallback(async (customerId: string): Promise<boolean> => {
    return true; // Allow all customers to be edited
  }, []);

  const getPermissionSync = useCallback((customerId: string) => {
    return {
      canView: true,
      canEdit: true,
      isAssigned: true
    };
  }, []);

  const getAllowedCustomerIds = useCallback(async (): Promise<string[]> => {
    // Return empty array - let components fetch all customers directly
    return [];
  }, []);

  const getAssignedCustomerIds = useCallback(async (): Promise<string[]> => {
    // Return empty array - no user assignments in no-auth mode
    return [];
  }, []);

  const refreshPermissions = useCallback(async (): Promise<void> => {
    // No-op in no-auth mode
  }, []);

  const clearCache = useCallback((): void => {
    // No-op in no-auth mode
  }, []);

  return {
    canViewCustomer,
    canEditCustomer,
    getPermissionSync,
    isAdmin,
    getAllowedCustomerIds,
    getAssignedCustomerIds,
    refreshPermissions,
    clearCache,
  };
};

// Simple WithPermissions component for no-auth mode
interface WithPermissionsProps {
  customerId?: string;
  requireEdit?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const WithPermissions: React.FC<WithPermissionsProps> = ({
  children,
  fallback = null,
}) => {
  // In no-auth mode, always allow access
  return <>{children}</>;
};

export default usePermissions;
