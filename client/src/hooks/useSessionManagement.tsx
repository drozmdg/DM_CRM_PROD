/**
 * Session Management Hook
 * Handles session refresh, timeout, and revocation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
// import { useAuth } from '../contexts/AuthContext'; // Temporarily disabled

interface SessionInfo {
  expiresAt: Date | null;
  timeUntilExpiry: number;
  isExpiringSoon: boolean;
  lastActivity: Date;
}

interface UseSessionManagementOptions {
  warningThreshold?: number; // Minutes before expiry to show warning
  autoRefreshThreshold?: number; // Minutes before expiry to auto-refresh
  idleTimeout?: number; // Minutes of inactivity before warning
  enableAutoRefresh?: boolean;
}

interface UseSessionManagementReturn {
  sessionInfo: SessionInfo;
  refreshSession: () => Promise<boolean>;
  revokeSession: () => Promise<void>;
  extendSession: () => void;
  isRefreshing: boolean;
  showExpiryWarning: boolean;
  showIdleWarning: boolean;
  dismissWarnings: () => void;
}

export const useSessionManagement = (
  options: UseSessionManagementOptions = {}
): UseSessionManagementReturn => {
  const {
    warningThreshold = 5, // 5 minutes
    autoRefreshThreshold = 2, // 2 minutes
    idleTimeout = 30, // 30 minutes
    enableAutoRefresh = true,
  } = options;

  const { session, supabase } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const [lastActivity, setLastActivity] = useState(new Date());
  
  const warningShownRef = useRef(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const idleTimeoutRef = useRef<NodeJS.Timeout>();

  // Calculate session info
  const getSessionInfo = useCallback((): SessionInfo => {
    if (!session) {
      return {
        expiresAt: null,
        timeUntilExpiry: 0,
        isExpiringSoon: false,
        lastActivity,
      };
    }

    const expiresAt = new Date((session.expires_at || 0) * 1000);
    const now = new Date();
    const timeUntilExpiry = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000 / 60));
    const isExpiringSoon = timeUntilExpiry <= warningThreshold;

    return {
      expiresAt,
      timeUntilExpiry,
      isExpiringSoon,
      lastActivity,
    };
  }, [session, warningThreshold, lastActivity]);

  const [sessionInfo, setSessionInfo] = useState<SessionInfo>(getSessionInfo());

  // Update session info regularly
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionInfo(getSessionInfo());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [getSessionInfo]);

  // Track user activity
  const updateActivity = useCallback(() => {
    setLastActivity(new Date());
    setShowIdleWarning(false);
    
    // Reset idle timeout
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    
    idleTimeoutRef.current = setTimeout(() => {
      setShowIdleWarning(true);
    }, idleTimeout * 60 * 1000);
  }, [idleTimeout]);

  // Set up activity listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initial activity update
    updateActivity();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, [updateActivity]);

  // Auto-refresh session
  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (isRefreshing) return false;

    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh failed:', error);
        return false;
      }

      if (data.session) {
        console.log('Session refreshed successfully');
        setShowExpiryWarning(false);
        warningShownRef.current = false;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Session refresh error:', error);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [supabase, isRefreshing]);

  // Revoke session (sign out)
  const revokeSession = useCallback(async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      setShowExpiryWarning(false);
      setShowIdleWarning(false);
      warningShownRef.current = false;
    } catch (error) {
      console.error('Session revocation failed:', error);
    }
  }, [supabase]);

  // Extend session by refreshing
  const extendSession = useCallback(() => {
    refreshSession();
    updateActivity();
  }, [refreshSession, updateActivity]);

  // Dismiss warnings
  const dismissWarnings = useCallback(() => {
    setShowExpiryWarning(false);
    setShowIdleWarning(false);
    warningShownRef.current = false;
  }, []);

  // Handle session expiry warnings and auto-refresh
  useEffect(() => {
    if (!session) return;

    const { timeUntilExpiry, isExpiringSoon } = sessionInfo;

    // Clear existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    if (timeUntilExpiry <= 0) {
      // Session has expired
      console.log('Session expired');
      return;
    }

    // Show warning if session is expiring soon and warning hasn't been shown
    if (isExpiringSoon && !warningShownRef.current) {
      setShowExpiryWarning(true);
      warningShownRef.current = true;
    }

    // Auto-refresh if enabled and within threshold
    if (enableAutoRefresh && timeUntilExpiry <= autoRefreshThreshold && timeUntilExpiry > 0) {
      console.log(`Auto-refreshing session in ${timeUntilExpiry} minutes`);
      
      refreshTimeoutRef.current = setTimeout(() => {
        refreshSession();
      }, (timeUntilExpiry - 1) * 60 * 1000); // Refresh 1 minute before threshold
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [session, sessionInfo, enableAutoRefresh, autoRefreshThreshold, refreshSession]);

  return {
    sessionInfo,
    refreshSession,
    revokeSession,
    extendSession,
    isRefreshing,
    showExpiryWarning,
    showIdleWarning,
    dismissWarnings,
  };
};

// Session Warning Component
interface SessionWarningProps {
  show: boolean;
  type: 'expiry' | 'idle';
  timeUntilExpiry?: number;
  onExtend: () => void;
  onDismiss: () => void;
  onSignOut: () => void;
}

export const SessionWarning: React.FC<SessionWarningProps> = ({
  show,
  type,
  timeUntilExpiry = 0,
  onExtend,
  onDismiss,
  onSignOut,
}) => {
  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              {type === 'expiry' ? 'Session Expiring Soon' : 'Idle Session Warning'}
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              {type === 'expiry' ? (
                <p>Your session will expire in {timeUntilExpiry} minute{timeUntilExpiry !== 1 ? 's' : ''}.</p>
              ) : (
                <p>You've been idle for a while. Your session may expire soon.</p>
              )}
            </div>
            <div className="mt-4 flex space-x-2">
              <button
                onClick={onExtend}
                className="text-sm bg-yellow-400 text-yellow-800 px-3 py-1 rounded font-medium hover:bg-yellow-500"
              >
                Extend Session
              </button>
              <button
                onClick={onDismiss}
                className="text-sm text-yellow-800 hover:text-yellow-900"
              >
                Dismiss
              </button>
              <button
                onClick={onSignOut}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default useSessionManagement;