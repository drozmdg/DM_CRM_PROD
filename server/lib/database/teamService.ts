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
      const { data: team, error } = await supabase
        .from('teams')
        .insert({
          name: teamData.name,
          finance_code: teamData.financeCode,
          customer_id: teamData.customerId
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
      financeCode: row.finance_code
    };
  }
}
