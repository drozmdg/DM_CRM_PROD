/**
 * Notification Service - Handles process notification configurations
 */

import { supabase } from '../supabase.js';

export interface ProcessNotification {
  id: string;
  processId: string;
  recipientName: string;
  recipientEmail: string;
  recipientRole?: string;
  notifyOn: Record<string, boolean>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class NotificationService {
  
  async getNotificationsByProcessId(processId: string): Promise<ProcessNotification[]> {
    try {
      const { data: notifications, error } = await supabase
        .from('process_notifications')
        .select('*')
        .eq('process_id', processId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (notifications || []).map(this.transformNotificationRow);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async getNotificationById(id: string): Promise<ProcessNotification | null> {
    try {
      const { data: notification, error } = await supabase
        .from('process_notifications')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!notification) return null;

      return this.transformNotificationRow(notification);
    } catch (error) {
      console.error('Error fetching notification:', error);
      throw error;
    }
  }

  async createNotification(
    processId: string, 
    notificationData: Omit<ProcessNotification, 'id' | 'processId' | 'createdAt' | 'updatedAt'>
  ): Promise<ProcessNotification> {
    try {
      const { data: notification, error } = await supabase
        .from('process_notifications')
        .insert({
          process_id: processId,
          recipient_name: notificationData.recipientName,
          recipient_email: notificationData.recipientEmail,
          recipient_role: notificationData.recipientRole || null,
          notify_on: notificationData.notifyOn || {},
          is_active: notificationData.isActive
        })
        .select()
        .single();

      if (error) throw error;

      return this.transformNotificationRow(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async updateNotification(
    id: string, 
    updates: Partial<ProcessNotification>
  ): Promise<ProcessNotification> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.recipientName !== undefined) updateData.recipient_name = updates.recipientName;
      if (updates.recipientEmail !== undefined) updateData.recipient_email = updates.recipientEmail;
      if (updates.recipientRole !== undefined) updateData.recipient_role = updates.recipientRole;
      if (updates.notifyOn !== undefined) updateData.notify_on = updates.notifyOn;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { data: notification, error } = await supabase
        .from('process_notifications')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return this.transformNotificationRow(notification);
    } catch (error) {
      console.error('Error updating notification:', error);
      throw error;
    }
  }

  async deleteNotification(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('process_notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  async getNotificationsByEmail(email: string): Promise<ProcessNotification[]> {
    try {
      const { data: notifications, error } = await supabase
        .from('process_notifications')
        .select('*')
        .eq('recipient_email', email)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (notifications || []).map(this.transformNotificationRow);
    } catch (error) {
      console.error('Error fetching notifications by email:', error);
      throw error;
    }
  }

  async getNotificationsForEvent(processId: string, eventType: string): Promise<ProcessNotification[]> {
    try {
      const { data: notifications, error } = await supabase
        .from('process_notifications')
        .select('*')
        .eq('process_id', processId)
        .eq('is_active', true);

      if (error) throw error;

      // Filter by event type on the application side since JSONB queries can be complex
      return (notifications || [])
        .map(this.transformNotificationRow)
        .filter(notification => notification.notifyOn[eventType] === true);
    } catch (error) {
      console.error('Error fetching notifications for event:', error);
      throw error;
    }
  }

  async toggleNotificationEvent(
    id: string, 
    eventType: string, 
    enabled: boolean
  ): Promise<ProcessNotification> {
    try {
      // First get the current notification to update the notifyOn object
      const current = await this.getNotificationById(id);
      if (!current) {
        throw new Error('Notification not found');
      }

      const updatedNotifyOn = {
        ...current.notifyOn,
        [eventType]: enabled
      };

      return this.updateNotification(id, { notifyOn: updatedNotifyOn });
    } catch (error) {
      console.error('Error toggling notification event:', error);
      throw error;
    }
  }

  private transformNotificationRow(row: any): ProcessNotification {
    return {
      id: row.id,
      processId: row.process_id,
      recipientName: row.recipient_name,
      recipientEmail: row.recipient_email,
      recipientRole: row.recipient_role || undefined,
      notifyOn: row.notify_on || {},
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Helper method to get available notification event types
  getAvailableEventTypes(): Array<{key: string, label: string, description: string}> {
    return [
      {
        key: 'fileReceived',
        label: 'File Received',
        description: 'When a file is successfully received from the source'
      },
      {
        key: 'fileDelivered',
        label: 'File Delivered',
        description: 'When a file is successfully delivered to the destination'
      },
      {
        key: 'processStarted',
        label: 'Process Started',
        description: 'When the process begins execution'
      },
      {
        key: 'processCompleted',
        label: 'Process Completed',
        description: 'When the process completes successfully'
      },
      {
        key: 'processError',
        label: 'Process Error',
        description: 'When an error occurs during process execution'
      },
      {
        key: 'approvalRequired',
        label: 'Approval Required',
        description: 'When the process requires approval to proceed'
      },
      {
        key: 'approvalReceived',
        label: 'Approval Received',
        description: 'When approval has been granted for the process'
      },
      {
        key: 'scheduleUpdate',
        label: 'Schedule Update',
        description: 'When the process schedule is modified'
      }
    ];
  }

  // Helper method to validate email format
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Helper method to get notification summary for a process
  async getNotificationSummary(processId: string): Promise<{
    totalRecipients: number;
    activeRecipients: number;
    eventCounts: Record<string, number>;
  }> {
    try {
      const notifications = await this.getNotificationsByProcessId(processId);
      
      const activeNotifications = notifications.filter(n => n.isActive);
      const eventCounts: Record<string, number> = {};

      // Count how many recipients are subscribed to each event type
      activeNotifications.forEach(notification => {
        Object.entries(notification.notifyOn).forEach(([event, enabled]) => {
          if (enabled) {
            eventCounts[event] = (eventCounts[event] || 0) + 1;
          }
        });
      });

      return {
        totalRecipients: notifications.length,
        activeRecipients: activeNotifications.length,
        eventCounts
      };
    } catch (error) {
      console.error('Error getting notification summary:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();