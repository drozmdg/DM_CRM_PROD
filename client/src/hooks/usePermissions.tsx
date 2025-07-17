// No-auth permissions hook - grants all permissions for internal/demo use
export const usePermissions = () => {
  return {
    canCreateCustomers: true,
    canEditCustomers: true,
    canDeleteCustomers: true,
    canViewCustomers: true,
    canCreateProcesses: true,
    canEditProcesses: true,
    canDeleteProcesses: true,
    canViewProcesses: true,
    canManageTeams: true,
    canManageServices: true,
    canManageDocuments: true,
    canViewReports: true,    canManageContacts: true,
    canAccessAI: true,
    // Admin function for backward compatibility
    isAdmin: () => true,
    // All permissions return true in no-auth mode
    hasPermission: () => true,
    hasAnyPermission: () => true,
    hasAllPermissions: () => true
  };
};

// Higher-order component for permission checking - allows all access in no-auth mode
export const WithPermissions = ({ 
  children, 
  requiredPermissions 
}: { 
  children: React.ReactNode, 
  requiredPermissions?: string[] 
}) => {
  // In no-auth mode, always render children
  return <>{children}</>;
};