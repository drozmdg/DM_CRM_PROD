/**
 * Team Service - Handles all team-related database operations
 */

import { supabase } from '../supabase.js';
import type { Team } from '../../../shared/types/index.js';

export class TeamService {
  
  async getAllTeams(): Promise<Team[]> {
    try {
      const { data: teams, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');

      if (error) throw error;

      return teams.map(this.transformTeamRow);
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  }

  async getTeamById(id: string): Promise<Team | null> {
    try {
      const { data: team, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!team) return null;

      return this.transformTeamRow(team);
    } catch (error) {
      console.error('Error fetching team:', error);
      throw error;
    }
  }

  async getTeamsByCustomerId(customerId: string): Promise<Team[]> {
    try {
      const { data: teams, error } = await supabase
        .from('teams')
        .select('*')
        .eq('customer_id', customerId)
        .order('name');

      if (error) throw error;

      return teams.map(this.transformTeamRow);
    } catch (error) {
      console.error('Error fetching teams by customer:', error);
      throw error;
    }
  }
  async createTeam(teamData: Omit<Team, 'id'> & { customerId: string }): Promise<Team> {
    try {
      // Generate a unique ID for the team
      const teamId = `team-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const { data: team, error } = await supabase
        .from('teams')
        .insert({
          id: teamId,
          name: teamData.name,
          finance_code: teamData.financeCode,
          customer_id: teamData.customerId,
          start_date: teamData.startDate,
          end_date: teamData.endDate
        })
        .select()
        .single();

      if (error) throw error;

      return this.transformTeamRow(team);
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team> {
    try {
      const { data: team, error } = await supabase
        .from('teams')
        .update({
          name: updates.name,
          finance_code: updates.financeCode,
          start_date: updates.startDate,
          end_date: updates.endDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return this.transformTeamRow(team);
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  }

  async deleteTeam(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  }

  async getTeamsByProcessId(processId: string): Promise<Team[]> {
    try {
      // First get the team IDs from process_team
      const { data: processTeams, error: ptError } = await supabase
        .from('process_team')
        .select('team_id')
        .eq('process_id', processId);

      if (ptError) throw ptError;

      if (!processTeams || processTeams.length === 0) {
        return [];
      }

      // Then get the full team details
      const teamIds = processTeams.map(pt => pt.team_id);
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .in('id', teamIds);

      if (teamsError) throw teamsError;

      return (teams || []).map(this.transformTeamRow);
    } catch (error) {
      console.error('Error fetching teams by process:', error);
      throw error;
    }
  }

  async assignTeamToProcess(processId: string, teamId: string): Promise<void> {
    try {
      // Check if assignment already exists
      const { data: existing, error: checkError } = await supabase
        .from('process_team')
        .select('*')
        .eq('process_id', processId)
        .eq('team_id', teamId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is what we want
        throw checkError;
      }

      if (existing) {
        // Assignment already exists
        return;
      }

      const { error } = await supabase
        .from('process_team')
        .insert({
          process_id: processId,
          team_id: teamId
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error assigning team to process:', error);
      throw error;
    }
  }

  async unassignTeamFromProcess(processId: string, teamId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('process_team')
        .delete()
        .eq('process_id', processId)
        .eq('team_id', teamId);

      if (error) throw error;
    } catch (error) {
      console.error('Error unassigning team from process:', error);
      throw error;
    }
  }

  async getTeamMetrics(): Promise<{
    total: number;
    byCustomer: Record<string, number>;
  }> {
    try {
      const { data: teams, error } = await supabase
        .from('teams')
        .select(`
          *,
          customers!inner (
            id,
            name
          )
        `);

      if (error) throw error;

      const total = teams.length;
      const byCustomer: Record<string, number> = {};

      teams.forEach(team => {
        const customerName = (team as any).customers.name;
        byCustomer[customerName] = (byCustomer[customerName] || 0) + 1;
      });

      return {
        total,
        byCustomer
      };
    } catch (error) {
      console.error('Error getting team metrics:', error);
      throw error;
    }
  }

  private transformTeamRow(row: any): Team {
    return {
      id: row.id,
      name: row.name,
      financeCode: row.finance_code,
      startDate: row.start_date,
      endDate: row.end_date
    };
  }
}

export const teamService = new TeamService();
