/**
 * Task Service - Handles process tasks and milestones database operations
 */

import { supabase } from '../supabase.js';
import type { ProcessTask, ProcessMilestone } from '../../../shared/types/index.js';

export class TaskService {
  // Process Tasks methods
  async getTasksByProcessId(processId: string): Promise<ProcessTask[]> {
    try {
      const { data, error } = await supabase
        .from('process_tasks')
        .select('*')
        .eq('process_id', processId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Transform and organize tasks with subtasks
      const tasks = (data || []).map(this.transformTaskRow);
      return this.organizeTasksWithSubtasks(tasks);
    } catch (error) {
      console.error('Error fetching process tasks:', error);
      throw error;
    }
  }

  async getTaskById(id: string): Promise<ProcessTask | null> {
    try {
      const { data, error } = await supabase
        .from('process_tasks')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (!data) return null;
      
      return this.transformTaskRow(data);
    } catch (error) {
      console.error('Error fetching task:', error);
      throw error;
    }
  }

  async createTask(processId: string, taskData: Omit<ProcessTask, 'id' | 'processId' | 'createdAt' | 'updatedAt'>): Promise<ProcessTask> {
    try {
      const { data, error } = await supabase
        .from('process_tasks')
        .insert({ 
          process_id: processId,
          parent_task_id: taskData.parentTaskId || null,
          title: taskData.title,
          description: taskData.description || null,
          status: taskData.status,
          priority: taskData.priority,
          assigned_to_id: taskData.assignedToId || null,
          due_date: taskData.dueDate || null,
          completed_date: taskData.completedDate || null
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return this.transformTaskRow(data);
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async updateTask(id: string, updates: Partial<ProcessTask>): Promise<ProcessTask> {
    try {
      // Build update object with only provided fields
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.assignedToId !== undefined) updateData.assigned_to_id = updates.assignedToId;
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
      if (updates.completedDate !== undefined) updateData.completed_date = updates.completedDate;
      
      const { data, error } = await supabase
        .from('process_tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return this.transformTaskRow(data);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  async deleteTask(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('process_tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  async getTaskProgress(processId: string): Promise<{ total: number; completed: number; percentage: number }> {
    try {
      // Get task data for the process
      const tasks = await this.getTasksByProcessId(processId);
      
      // Flatten all tasks (including subtasks) to get accurate count
      const allTasks = this.flattenTasks(tasks);
      
      const total = allTasks.length;
      const completed = allTasks.filter(task => task.status === 'Completed').length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return { total, completed, percentage };
    } catch (error) {
      console.error('Error calculating task progress:', error);
      return { total: 0, completed: 0, percentage: 0 };
    }
  }

  // Process Milestones methods
  async getMilestonesByProcessId(processId: string): Promise<ProcessMilestone[]> {
    try {
      const { data, error } = await supabase
        .from('process_milestones')
        .select('*')
        .eq('process_id', processId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map(this.transformMilestoneRow);
    } catch (error) {
      console.error('Error fetching process milestones:', error);
      throw error;
    }
  }

  async createMilestone(processId: string, milestoneData: Omit<ProcessMilestone, 'id' | 'processId' | 'createdAt' | 'updatedAt'>): Promise<ProcessMilestone> {
    try {
      const { data, error } = await supabase
        .from('process_milestones')
        .insert({ 
          process_id: processId,
          milestone_type: milestoneData.milestoneType,
          achieved_date: milestoneData.achievedDate || null,
          notes: milestoneData.notes || null
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return this.transformMilestoneRow(data);
    } catch (error) {
      console.error('Error creating milestone:', error);
      throw error;
    }
  }

  async updateMilestone(id: string, updates: Partial<ProcessMilestone>): Promise<ProcessMilestone> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      if (updates.achievedDate !== undefined) updateData.achieved_date = updates.achievedDate;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      
      const { data, error } = await supabase
        .from('process_milestones')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return this.transformMilestoneRow(data);
    } catch (error) {
      console.error('Error updating milestone:', error);
      throw error;
    }
  }

  async deleteMilestone(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('process_milestones')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting milestone:', error);
      throw error;
    }
  }

  // Helper methods
  private transformTaskRow(row: any): ProcessTask {
    return {
      id: row.id,
      processId: row.process_id,
      parentTaskId: row.parent_task_id || undefined,
      title: row.title,
      description: row.description || undefined,
      status: row.status,
      priority: row.priority,
      assignedToId: row.assigned_to_id || undefined,
      dueDate: row.due_date || undefined,
      completedDate: row.completed_date || undefined,
      subtasks: [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private transformMilestoneRow(row: any): ProcessMilestone {
    return {
      id: row.id,
      processId: row.process_id,
      milestoneType: row.milestone_type,
      achievedDate: row.achieved_date || undefined,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private organizeTasksWithSubtasks(tasks: ProcessTask[]): ProcessTask[] {
    const taskMap = new Map<string, ProcessTask>();
    const rootTasks: ProcessTask[] = [];

    // First pass: create map of all tasks
    tasks.forEach(task => {
      taskMap.set(task.id, { ...task, subtasks: [] });
    });

    // Second pass: organize parent-child relationships
    tasks.forEach(task => {
      const taskWithSubtasks = taskMap.get(task.id)!;
      if (task.parentTaskId) {
        const parent = taskMap.get(task.parentTaskId);
        if (parent) {
          parent.subtasks!.push(taskWithSubtasks);
        }
      } else {
        rootTasks.push(taskWithSubtasks);
      }
    });

    return rootTasks;
  }

  private flattenTasks(tasks: ProcessTask[]): ProcessTask[] {
    const flattened: ProcessTask[] = [];
    
    function flatten(taskList: ProcessTask[]) {
      for (const task of taskList) {
        flattened.push(task);
        if (task.subtasks && task.subtasks.length > 0) {
          flatten(task.subtasks);
        }
      }
    }
    
    flatten(tasks);
    return flattened;
  }

  async getAllProcessesProgress(): Promise<Record<string, number>> {
    try {
      // Get all processes first
      const { data: processes, error: processError } = await supabase
        .from('processes')
        .select('id');
      
      if (processError) throw processError;
      
      if (!processes || processes.length === 0) {
        return {};
      }
      
      // Calculate progress for each process based on task completion
      const progressMap: Record<string, number> = {};
      
      for (const process of processes) {
        const progress = await this.getTaskProgress(process.id);
        progressMap[process.id] = progress.percentage;
      }
      
      return progressMap;
    } catch (error) {
      console.error('Error calculating all processes progress based on tasks:', error);
      return {};
    }
  }

  async getUpcomingTasksAcrossAllProcesses(limit: number = 5): Promise<any[]> {
    try {
      // Get all tasks with due dates that are not completed
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: tasks, error } = await supabase
        .from('process_tasks')
        .select(`
          *,
          processes:process_id (
            id,
            name,
            customer_id
          )
        `)
        .not('due_date', 'is', null)
        .neq('status', 'Completed')
        .gte('due_date', today.toISOString())
        .order('due_date', { ascending: true })
        .limit(limit);
      
      if (error) throw error;
      
      // Get customer info for each task
      const customerIds = [...new Set(tasks?.map(t => t.processes?.customer_id).filter(Boolean))];
      
      let customersMap = new Map();
      if (customerIds.length > 0) {
        const { data: customers } = await supabase
          .from('customers')
          .select('id, name')
          .in('id', customerIds);
          
        customers?.forEach(c => customersMap.set(c.id, c.name));
      }
      
      // Transform the data to include customer and process info
      return (tasks || []).map(task => ({
        id: task.id,
        title: task.title,
        dueDate: task.due_date,
        status: task.status,
        priority: task.priority,
        processId: task.process_id,
        processName: task.processes?.name || 'Unknown Process',
        customerId: task.processes?.customer_id,
        customerName: customersMap.get(task.processes?.customer_id) || 'Unknown Customer'
      }));
    } catch (error) {
      console.error('Error fetching upcoming tasks across all processes:', error);
      throw error;
    }
  }
}

export const taskService = new TaskService();