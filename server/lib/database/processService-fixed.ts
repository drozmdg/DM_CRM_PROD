// processService-fixed.ts
import { supabase } from "../supabase";
import { type Process, type InsertProcess } from "../../../types";

export class ProcessService {
  async getProcessesByCustomerId(customerId: string): Promise<Process[]> {
    try {
      const { data: processes, error } = await supabase
        .from("processes")
        .select(`
          *,
          timeline_events (*)
        `)
        .eq("customer_id", customerId)
        .order("start_date", { ascending: false });

      if (error) throw error;

      return processes.map(this.transformProcessRow);
    } catch (error) {
      console.error("Error getting processes by customer ID:", error);
      throw error;
    }
  }

  async getProcessById(id: string): Promise<Process | null> {
    try {
      const { data: process, error } = await supabase
        .from("processes")
        .select(`
          *,
          timeline_events (*)
        `)
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return null;
        }
        throw error;
      }

      return this.transformProcessRow(process);
    } catch (error) {
      console.error("Error getting process by ID:", error);
      throw error;
    }
  }

  async createProcess(process: InsertProcess): Promise<Process> {
    try {
      const { data: createdProcess, error } = await supabase
        .from("processes")
        .insert({
          id: process.id,
          name: process.name,
          jira_ticket: process.jiraTicket,
          customer_id: process.customerId,
          status: process.status,
          start_date: process.startDate,
          due_date: process.dueDate,
          end_date: process.endDate,
          sdlc_stage: process.sdlcStage,
          estimate: process.estimate,
          dev_sprint: process.devSprint,
          approval_status: process.approvalStatus,
          approved_date: process.approvedDate,
          deployed_date: process.deployedDate,
          functional_area: process.functionalArea,
          output_delivery_method: process.outputDeliveryMethod,
          output_delivery_details: process.outputDeliveryDetails,
        })
        .select()
        .single();

      if (error) throw error;

      // Add initial timeline event for the SDLC stage
      await this.addTimelineEvent(createdProcess.id, {
        title: `Process created in ${process.sdlcStage} stage`,
        description: `Process created in ${process.sdlcStage} stage`,
        eventType: process.sdlcStage,
        date: process.startDate || new Date().toISOString(),
      });

      return this.getProcessById(createdProcess.id) as Promise<Process>;
    } catch (error) {
      console.error("Error creating process:", error);
      throw error;
    }
  }

  async updateProcess(id: string, updates: Partial<Process>): Promise<Process> {
    try {
      console.log('DEBUG: Updating process:', { id, updates });
      
      const currentProcess = await this.getProcessById(id);
      if (!currentProcess) {
        console.error('DEBUG: Process not found:', id);
        throw new Error('Process not found');
      }

      // Temporarily filter out missing columns
      const filteredUpdates: any = {};
      if (updates.name !== undefined) filteredUpdates.name = updates.name;
      if (updates.jiraTicket !== undefined) filteredUpdates.jira_ticket = updates.jiraTicket;
      if (updates.status !== undefined) filteredUpdates.status = updates.status;
      if (updates.startDate !== undefined) filteredUpdates.start_date = updates.startDate;
      if (updates.dueDate !== undefined) filteredUpdates.due_date = updates.dueDate;
      if (updates.endDate !== undefined) filteredUpdates.end_date = updates.endDate;
      if (updates.sdlcStage !== undefined) filteredUpdates.sdlc_stage = updates.sdlcStage;
      if (updates.estimate !== undefined) filteredUpdates.estimate = updates.estimate;
      if (updates.devSprint !== undefined) filteredUpdates.dev_sprint = updates.devSprint;
      if (updates.approvalStatus !== undefined) filteredUpdates.approval_status = updates.approvalStatus;
      if (updates.approvedDate !== undefined) filteredUpdates.approved_date = updates.approvedDate;
      if (updates.deployedDate !== undefined) filteredUpdates.deployed_date = updates.deployedDate;
      if (updates.functionalArea !== undefined) filteredUpdates.functional_area = updates.functionalArea;
      if (updates.outputDeliveryMethod !== undefined) filteredUpdates.output_delivery_method = updates.outputDeliveryMethod;
      if (updates.outputDeliveryDetails !== undefined) filteredUpdates.output_delivery_details = updates.outputDeliveryDetails;
      
      // Skip these fields that don't exist in the database yet
      // if (updates.responsibleContactId !== undefined) filteredUpdates.responsible_contact_id = updates.responsibleContactId;
      // if (updates.progress !== undefined) filteredUpdates.progress = updates.progress;
      
      filteredUpdates.updated_at = new Date().toISOString();

      console.log('DEBUG: Updating process with filtered data:', filteredUpdates);

      const { data: process, error } = await supabase
        .from('processes')
        .update(filteredUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('DEBUG: Supabase error updating process:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          filteredUpdates
        });
        throw new Error(`Failed to update process: ${error.message}`);
      }

      console.log('DEBUG: Process updated successfully:', process);

      // Add timeline events for changes, but don't let failures here break the update
      try {
        // Add timeline event if SDLC stage changed
        if (updates.sdlcStage && updates.sdlcStage !== currentProcess.sdlcStage) {
          console.log('DEBUG: Adding timeline event for SDLC stage change');
          await this.addTimelineEvent(id, {
            title: `Moved to ${updates.sdlcStage}`,
            description: `Process moved from ${currentProcess.sdlcStage} to ${updates.sdlcStage} stage`,
            eventType: 'process-stage-change',
            date: new Date().toISOString()
          });
        }

        // Add timeline event if status changed
        if (updates.status && updates.status !== currentProcess.status) {
          console.log('DEBUG: Adding timeline event for status change');
          await this.addTimelineEvent(id, {
            title: `Status Changed`,
            description: `Process status changed from ${currentProcess.status} to ${updates.status}`,
            eventType: 'process-status-change',
            date: new Date().toISOString()
          });
        }
      } catch (timelineError) {
        console.error('DEBUG: Error creating timeline events, but continuing:', timelineError);
        // Don't re-throw, let the update succeed even if timeline events fail
      }

      // Ensure we get the full process with updated fields
      console.log('DEBUG: Fetching updated process with timeline');
      const updatedProcess = await this.getProcessById(id);
      console.log('DEBUG: Final updated process:', updatedProcess);
      return updatedProcess as Process;
    } catch (error) {
      console.error('DEBUG: Error updating process:', error);
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

  async addTimelineEvent(processId: string, event: { title: string; description: string; eventType: string; date: string }): Promise<any> {
    try {
      console.log('DEBUG: Adding timeline event:', {
        processId,
        eventType: event.eventType,
        title: event.title
      });

      const { data: timelineEvent, error } = await supabase
        .from('timeline_events')
        .insert({
          process_id: processId,
          event_type: event.eventType,
          title: event.title,
          description: event.description,
          created_at: event.date
        })
        .select()
        .single();

      if (error) {
        console.error('DEBUG: Supabase error creating timeline event:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        // Return a placeholder object instead of throwing
        return {
          id: 'error-' + Date.now(),
          date: event.date,
          stage: event.eventType,
          title: event.title,
          description: `Error: ${error.message}`
        };
      }

      console.log('DEBUG: Timeline event created successfully:', timelineEvent);
      
      return {
        id: timelineEvent.id,
        date: timelineEvent.created_at,
        stage: timelineEvent.event_type,
        title: timelineEvent.title,
        description: timelineEvent.description
      };
    } catch (error) {
      console.error('DEBUG: Error adding timeline event:', error);
      // Return a placeholder object instead of throwing
      return {
        id: 'error-catch-' + Date.now(),
        date: event.date,
        stage: event.eventType,
        title: event.title,
        description: error.message || 'Unknown error occurred'
      };
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

      processes.forEach(process => {
        // Count by status
        byStatus[process.status] = (byStatus[process.status] || 0) + 1;

        // Count by SDLC stage
        byStage[process.sdlc_stage] = (byStage[process.sdlc_stage] || 0) + 1;

        // Sum estimates
        if (process.estimate) {
          totalEstimate += process.estimate;
        }
      });

      return {
        total,
        byStatus,
        byStage,
        avgEstimate: total > 0 ? totalEstimate / total : 0
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
      customerId: row.customer_id,
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
      functionalArea: row.functional_area,
      responsibleContactId: row.responsible_contact_id,
      progress: row.progress || 0,
      outputDeliveryMethod: row.output_delivery_method,
      outputDeliveryDetails: row.output_delivery_details,
      timeline: (row.timeline_events || []).map((event: any) => ({
        id: event.id,
        date: event.created_at,
        stage: event.event_type,
        description: event.description,
        title: event.title
      }))
    };
  }
}
