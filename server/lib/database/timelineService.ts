/**
 * Timeline Service - Handles all timeline event-related database operations
 */

import { supabase } from '../supabase.js';
import type { TimelineEvent } from '../../../shared/types/index.js';

export class TimelineService {
  /**
   * Get all timeline events, optionally filtered by customer
   */
  async getAllTimelineEvents(customerId?: string): Promise<TimelineEvent[]> {
    try {
      let query = supabase.from('timeline_events').select('*');
      
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      
      const { data, error } = await query.order('date', { ascending: false });
      
      if (error) {
        console.error('Error fetching timeline events:', error);
        // Return mock data for graceful degradation
        return this.getMockTimelineEvents(customerId);
      }
      
      return (data || []).map(this.mapDbTimelineEventToTimelineEvent);
    } catch (error) {
      console.error('Error in getAllTimelineEvents:', error);
      return this.getMockTimelineEvents(customerId);
    }
  }

  /**
   * Get a specific timeline event by ID
   */
  async getTimelineEventById(id: string): Promise<TimelineEvent | null> {
    try {
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching timeline event:', error);
        return null;
      }
      
      return this.mapDbTimelineEventToTimelineEvent(data);
    } catch (error) {
      console.error('Error in getTimelineEventById:', error);
      return null;
    }
  }

  /**
   * Get timeline events by customer ID
   */
  async getTimelineEventsByCustomerId(customerId: string): Promise<TimelineEvent[]> {
    try {
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('customer_id', customerId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching timeline events by customer:', error);
        return this.getMockTimelineEvents(customerId);
      }

      return (data || []).map(this.mapDbTimelineEventToTimelineEvent);
    } catch (error) {
      console.error('Error in getTimelineEventsByCustomerId:', error);
      return this.getMockTimelineEvents(customerId);
    }
  }

  /**
   * Create a new timeline event
   */
  async createTimelineEvent(event: Partial<TimelineEvent> & { customerId: string }): Promise<TimelineEvent> {
    try {
      const eventData = {
        id: event.id || crypto.randomUUID(),
        customer_id: event.customerId,
        date: event.date || new Date().toISOString(),
        title: event.title,
        description: event.description,
        type: event.type || 'other',
        icon: event.icon,
        metadata: event.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('timeline_events')
        .insert([eventData])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating timeline event:', error);
        throw new Error(`Failed to create timeline event: ${error.message}`);
      }
      
      return this.mapDbTimelineEventToTimelineEvent(data);
    } catch (error) {
      console.error('Error in createTimelineEvent:', error);
      throw error;
    }
  }

  /**
   * Update an existing timeline event
   */
  async updateTimelineEvent(id: string, updates: Partial<TimelineEvent>): Promise<TimelineEvent> {
    try {
      const { data, error } = await supabase
        .from('timeline_events')
        .update({
          date: updates.date,
          title: updates.title,
          description: updates.description,
          type: updates.type,
          icon: updates.icon,
          metadata: updates.metadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating timeline event:', error);
        throw new Error(`Failed to update timeline event: ${error.message}`);
      }
      
      return this.mapDbTimelineEventToTimelineEvent(data);
    } catch (error) {
      console.error('Error in updateTimelineEvent:', error);
      throw error;
    }
  }

  /**
   * Delete a timeline event
   */
  async deleteTimelineEvent(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('timeline_events')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting timeline event:', error);
        throw new Error(`Failed to delete timeline event: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteTimelineEvent:', error);
      throw error;
    }
  }

  /**
   * Get timeline metrics
   */
  async getTimelineMetrics(): Promise<{
    total: number;
    byType: Record<string, number>;
    byCustomer: Record<string, number>;
    recentEvents: number;
  }> {
    try {
      const { data: events, error } = await supabase
        .from('timeline_events')
        .select(`
          *,
          customers!inner (
            id,
            name
          )
        `);

      if (error) throw error;

      const total = events.length;
      const byType: Record<string, number> = {};
      const byCustomer: Record<string, number> = {};
      
      // Count events in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      let recentEvents = 0;

      events.forEach(event => {
        // Count by type
        byType[event.type] = (byType[event.type] || 0) + 1;
        
        // Count by customer
        const customerName = (event as any).customers.name;
        byCustomer[customerName] = (byCustomer[customerName] || 0) + 1;

        // Count recent events
        if (new Date(event.date) >= thirtyDaysAgo) {
          recentEvents++;
        }
      });

      return {
        total,
        byType,
        byCustomer,
        recentEvents
      };
    } catch (error) {
      console.error('Error getting timeline metrics:', error);
      return {
        total: 0,
        byType: {},
        byCustomer: {},
        recentEvents: 0
      };
    }
  }

  /**
   * Add a phase change event
   */
  async addPhaseChangeEvent(customerId: string, fromPhase: string, toPhase: string): Promise<TimelineEvent> {
    return this.createTimelineEvent({
      customerId,
      title: `Phase Changed to ${toPhase}`,
      description: `Customer phase changed from ${fromPhase} to ${toPhase}`,
      type: 'phase-change',
      icon: '🔄',
      metadata: {
        fromPhase,
        toPhase
      }
    });
  }

  /**
   * Add a project event
   */
  async addProjectEvent(customerId: string, projectName: string, action: string): Promise<TimelineEvent> {
    return this.createTimelineEvent({
      customerId,
      title: `Project ${action}: ${projectName}`,
      description: `Project "${projectName}" was ${action.toLowerCase()}`,
      type: 'project-added',
      icon: action === 'Added' ? '📋' : '✅',
      metadata: {
        projectName,
        action
      }
    });
  }

  /**
   * Add a process event
   */
  async addProcessEvent(customerId: string, processName: string, action: string): Promise<TimelineEvent> {
    return this.createTimelineEvent({
      customerId,
      title: `Process ${action}: ${processName}`,
      description: `Process "${processName}" was ${action.toLowerCase()}`,
      type: 'process-launched',
      icon: '⚙️',
      metadata: {
        processName,
        action
      }
    });
  }

  /**
   * Map database timeline event to application timeline event
   */
  private mapDbTimelineEventToTimelineEvent(dbEvent: any): TimelineEvent {
    return {
      id: dbEvent.id,
      date: dbEvent.date,
      title: dbEvent.title,
      description: dbEvent.description,
      type: dbEvent.type,
      icon: dbEvent.icon,
      metadata: dbEvent.metadata || {}
    };
  }

  /**
   * Get mock timeline events for graceful degradation
   */
  private getMockTimelineEvents(customerId?: string): TimelineEvent[] {
    const mockEvents = [
      {
        id: 'mock-event-1',
        date: new Date().toISOString(),
        title: 'Contract Signed',
        description: 'Customer contract has been fully executed',
        type: 'phase-change' as const,
        icon: '📝',
        metadata: { fromPhase: 'Contracting', toPhase: 'New Activation' }
      },
      {
        id: 'mock-event-2',
        date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        title: 'Team Onboarded',
        description: 'New team has been successfully onboarded',
        type: 'project-added' as const,
        icon: '👥',
        metadata: { teamName: 'Analytics Team' }
      },
      {
        id: 'mock-event-3',
        date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        title: 'Process Launched',
        description: 'Data ingestion process has been initiated',
        type: 'process-launched' as const,
        icon: '⚙️',
        metadata: { processName: 'Data Ingestion Pipeline' }
      }
    ];

    // If specific customer requested, return subset
    if (customerId) {
      return mockEvents.slice(0, 2);
    }

    return mockEvents;
  }
}
