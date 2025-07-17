/**
 * Session Cleanup Service
 * Handles cleanup of expired sessions and security maintenance
 */

import { supabase } from '../supabase.js';

export class SessionCleanupService {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

  /**
   * Start automatic session cleanup
   */
  start(): void {
    if (this.cleanupInterval) {
      console.warn('Session cleanup service is already running');
      return;
    }

    console.log('🧹 Starting session cleanup service...');
    
    // Run cleanup immediately
    this.performCleanup();
    
    // Schedule periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.CLEANUP_INTERVAL_MS);
  }

  /**
   * Stop automatic session cleanup
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('🛑 Session cleanup service stopped');
    }
  }

  /**
   * Perform cleanup operations
   */
  private async performCleanup(): Promise<void> {
    try {
      await Promise.all([
        this.cleanupExpiredSessions(),
        this.cleanupOldAuditLogs(),
        this.resetFailedLoginAttempts()
      ]);
    } catch (error) {
      console.error('Error during session cleanup:', error);
    }
  }

  /**
   * Remove expired sessions from database
   */
  private async cleanupExpiredSessions(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) {
        console.error('Error cleaning up expired sessions:', error);
        return;
      }

      if (data && data.length > 0) {
        console.log(`🧹 Cleaned up ${data.length} expired sessions`);
      }
    } catch (error) {
      console.error('Error in cleanupExpiredSessions:', error);
    }
  }

  /**
   * Remove old audit logs (keep last 90 days)
   */
  private async cleanupOldAuditLogs(): Promise<void> {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data, error } = await supabase
        .from('audit_logs')
        .delete()
        .lt('created_at', ninetyDaysAgo.toISOString())
        .select('id');

      if (error) {
        console.error('Error cleaning up old audit logs:', error);
        return;
      }

      if (data && data.length > 0) {
        console.log(`🧹 Cleaned up ${data.length} old audit log entries`);
      }
    } catch (error) {
      console.error('Error in cleanupOldAuditLogs:', error);
    }
  }

  /**
   * Reset failed login attempts for unlocked accounts
   */
  private async resetFailedLoginAttempts(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ 
          failed_login_attempts: 0,
          locked_until: null
        })
        .lt('locked_until', new Date().toISOString())
        .neq('locked_until', null)
        .select('id');

      if (error) {
        console.error('Error resetting failed login attempts:', error);
        return;
      }

      if (data && data.length > 0) {
        console.log(`🔓 Unlocked ${data.length} user accounts`);
      }
    } catch (error) {
      console.error('Error in resetFailedLoginAttempts:', error);
    }
  }

  /**
   * Clean up sessions for a specific user
   */
  async cleanupUserSessions(userId: string, keepCurrent?: string): Promise<void> {
    try {
      let query = supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', userId);

      if (keepCurrent) {
        query = query.neq('session_token', keepCurrent);
      }

      const { error } = await query;

      if (error) {
        console.error('Error cleaning up user sessions:', error);
        throw new Error('Failed to cleanup user sessions');
      }

      console.log(`🧹 Cleaned up sessions for user ${userId}`);
    } catch (error) {
      console.error('Error in cleanupUserSessions:', error);
      throw error;
    }
  }

  /**
   * Get session cleanup statistics
   */
  async getCleanupStats(): Promise<{
    expiredSessions: number;
    oldAuditLogs: number;
    lockedUsers: number;
  }> {
    try {
      const now = new Date().toISOString();
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const [expiredSessions, oldAuditLogs, lockedUsers] = await Promise.all([
        supabase
          .from('user_sessions')
          .select('id', { count: 'exact' })
          .lt('expires_at', now),
        
        supabase
          .from('audit_logs')
          .select('id', { count: 'exact' })
          .lt('created_at', ninetyDaysAgo.toISOString()),
        
        supabase
          .from('users')
          .select('id', { count: 'exact' })
          .gt('locked_until', now)
      ]);

      return {
        expiredSessions: expiredSessions.count || 0,
        oldAuditLogs: oldAuditLogs.count || 0,
        lockedUsers: lockedUsers.count || 0
      };
    } catch (error) {
      console.error('Error getting cleanup stats:', error);
      return {
        expiredSessions: 0,
        oldAuditLogs: 0,
        lockedUsers: 0
      };
    }
  }

  /**
   * Force cleanup all expired data (admin operation)
   */
  async forceCleanupAll(): Promise<void> {
    console.log('🧹 Starting forced cleanup of all expired data...');
    await this.performCleanup();
    console.log('✅ Forced cleanup completed');
  }
}

// Export singleton instance
export const sessionCleanupService = new SessionCleanupService();