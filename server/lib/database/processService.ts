/**
 * Process Service - Handles all process-related database operations
 */

import { supabase } from '../supabase.js';
import type { Process, ProcessTimelineEvent } from '../../../shared/types/index.js';

export class ProcessService {
  
  async getAllProcesses(): Promise<Process[]> {
    try {
      const { data: processes, error } = await supabase
        .from('processes')
        .select(`
          *,
          process_timeline_events (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return processes.map(this.transformProcessRow);
    } catch (error) {
      console.error('Error fetching processes:', error);
      throw error;
    }
  }

  async getProcessById(id: string): Promise<Process | null> {
    try {
      const { data: process, error } = await supabase
        .from('processes')
        .select(`
          *,
          process_timeline_events (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!process) return null;

      return this.transformProcessRow(process);
    } catch (error) {
      console.error('Error fetching process:', error);
      throw error;
    }
  }

  async getProcessesByCustomerId(customerId: string): Promise<Process[]> {
    try {
      const { data: processes, error } = await supabase
        .from('processes')
        .select(`
          *,
          process_timeline_events (*)
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return processes.map(this.transformProcessRow);
    } catch (error) {
      console.error('Error fetching processes by customer:', error);
      throw error;
    }
  }

  async createProcess(processData: Omit<Process, 'id' | 'timeline'>): Promise<Process> {
    try {
      const { data: process, error } = await supabase
        .from('processes')
        .insert({
          name: processData.name,
          jira_ticket: processData.jiraTicket,
          status: processData.status,
          start_date: processData.startDate,
          due_date: processData.dueDate,
          end_date: processData.endDate,
          sdlc_stage: processData.sdlcStage,
          estimate: processData.estimate,
          dev_sprint: processData.devSprint,
          approval_status: processData.approvalStatus,
          approved_date: processData.approvedDate,
          deployed_date: processData.deployedDate,
          functional_area: processData.functionalArea,
          contact_id: processData.contactId,
          output_delivery_method: processData.outputDeliveryMethod,
          output_delivery_details: processData.outputDeliveryDetails,
          customer_id: (processData as any).customerId // This should be passed in the data
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial timeline event
      await this.addTimelineEvent(process.id, {
        id: '',
        date: new Date().toISOString(),
        stage: processData.sdlcStage,
        description: `Process created in ${processData.sdlcStage} stage`
      });

      return this.getProcessById(process.id) as Promise<Process>;
    } catch (error) {
      console.error('Error creating process:', error);
      throw error;
    }
  }

  async updateProcess(id: string, updates: Partial<Process>): Promise<Process> {
    try {
      const currentProcess = await this.getProcessById(id);
      if (!currentProcess) throw new Error('Process not found');

      const { data: process, error } = await supabase
        .from('processes')
        .update({
          name: updates.name,
          jira_ticket: updates.jiraTicket,
          status: updates.status,
          start_date: updates.startDate,
          due_date: updates.dueDate,
          end_date: updates.endDate,
          sdlc_stage: updates.sdlcStage,
          estimate: updates.estimate,
          dev_sprint: updates.devSprint,
          approval_status: updates.approvalStatus,
          approved_date: updates.approvedDate,
          deployed_date: updates.deployedDate,
          functional_area: updates.functionalArea,
          contact_id: updates.contactId,
          output_delivery_method: updates.outputDeliveryMethod,
          output_delivery_details: updates.outputDeliveryDetails,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Add timeline event if SDLC stage changed
      if (updates.sdlcStage && updates.sdlcStage !== currentProcess.sdlcStage) {
        await this.addTimelineEvent(id, {
          id: '',
          date: new Date().toISOString(),
          stage: updates.sdlcStage,
          description: `Moved to ${updates.sdlcStage} stage`
        });
      }

      // Add timeline event if status changed
      if (updates.status && updates.status !== currentProcess.status) {
        await this.addTimelineEvent(id, {
          id: '',
          date: new Date().toISOString(),
          stage: currentProcess.sdlcStage,
          description: `Status changed to ${updates.status}`
        });
      }

      return this.getProcessById(id) as Promise<Process>;
    } catch (error) {
      console.error('Error updating process:', error);
      throw error;
    }
  }

  async deleteProcess(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('processes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting process:', error);
      throw error;
    }
  }

  async addTimelineEvent(processId: string, event: Omit<ProcessTimelineEvent, 'id'>): Promise<ProcessTimelineEvent> {
    try {
      const { data: timelineEvent, error } = await supabase
        .from('process_timeline_events')
        .insert({
          process_id: processId,
          date: event.date,
          stage: event.stage,
          description: event.description
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: timelineEvent.id,
        date: timelineEvent.date,
        stage: timelineEvent.stage,
        description: timelineEvent.description
      };
    } catch (error) {
      console.error('Error adding timeline event:', error);
      throw error;
    }
  }

  async getProcessMetrics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byStage: Record<string, number>;
    avgEstimate: number;
  }> {
    try {
      const { data: processes, error } = await supabase
        .from('processes')
        .select('status, sdlc_stage, estimate');

      if (error) throw error;

      const total = processes.length;
      const byStatus: Record<string, number> = {};
      const byStage: Record<string, number> = {};
      let totalEstimate = 0;
      let estimateCount = 0;

      processes.forEach(process => {
        // Count by status
        byStatus[process.status] = (byStatus[process.status] || 0) + 1;
        
        // Count by SDLC stage
        byStage[process.sdlc_stage] = (byStage[process.sdlc_stage] || 0) + 1;
        
        // Calculate average estimate
        if (process.estimate) {
          totalEstimate += process.estimate;
          estimateCount++;
        }
      });

      const avgEstimate = estimateCount > 0 ? totalEstimate / estimateCount : 0;

      return {
        total,
        byStatus,
        byStage,
        avgEstimate
      };
    } catch (error) {
      console.error('Error getting process metrics:', error);
      throw error;
    }
  }
  private transformProcessRow(row: any): Process {
    return {
      id: row.id,
      name: row.name,
      jiraTicket: row.jira_ticket,
      status: row.status,
      startDate: row.start_date,
      dueDate: row.due_date,
      endDate: row.end_date,
      sdlcStage: row.sdlc_stage,
      estimate: row.estimate,
      devSprint: row.dev_sprint,
      approvalStatus: row.approval_status,
      approvedDate: row.approved_date,
      deployedDate: row.deployed_date,
      supportedTeamIds: row.supported_team_ids,
      functionalArea: row.functional_area,
      documentIds: row.document_ids,
      contactId: row.contact_id,
      outputDeliveryMethod: row.output_delivery_method,
      outputDeliveryDetails: row.output_delivery_details,
      customerId: row.customer_id, // Add the missing customer_id mapping
      timeline: (row.process_timeline_events || []).map((event: any) => ({
        id: event.id,
        date: event.date,
        stage: event.stage,
        description: event.description
      }))
    };
  }
}
