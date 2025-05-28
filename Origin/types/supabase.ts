/**
 * TypeScript definitions for Supabase database schema
 *
 * This file defines the types for the Supabase database tables and relationships.
 * It provides type safety when interacting with the database through the Supabase client.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          name: string
          logo: string | null
          avatar_color: string | null
          phase: CustomerPhase
          contract_start_date: string | null
          contract_end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          logo?: string | null
          avatar_color?: string | null
          phase: CustomerPhase
          contract_start_date?: string | null
          contract_end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo?: string | null
          avatar_color?: string | null
          phase?: CustomerPhase
          contract_start_date?: string | null
          contract_end_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          customer_id: string
          name: string
          finance_code: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          name: string
          finance_code: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          name?: string
          finance_code?: string
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          customer_id: string
          name: string
          monthly_hours: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          name: string
          monthly_hours: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          name?: string
          monthly_hours?: number
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          customer_id: string
          name: string
          description: string | null
          start_date: string
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          name: string
          description?: string | null
          start_date: string
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          name?: string
          description?: string | null
          start_date?: string
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      processes: {
        Row: {
          id: string
          customer_id: string
          name: string
          jira_ticket: string | null
          status: ProcessStatus
          start_date: string
          due_date: string | null
          end_date: string | null
          sdlc_stage: SDLCStage
          estimate: number | null
          dev_sprint: string | null
          approval_status: ApprovalStatus
          approved_date: string | null
          deployed_date: string | null
          functional_area: FunctionalArea | null
          contact_id: string | null
          output_delivery_method: OutputDeliveryMethod | null
          output_delivery_details: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          name: string
          jira_ticket?: string | null
          status: ProcessStatus
          start_date: string
          due_date?: string | null
          end_date?: string | null
          sdlc_stage: SDLCStage
          estimate?: number | null
          dev_sprint?: string | null
          approval_status: ApprovalStatus
          approved_date?: string | null
          deployed_date?: string | null
          functional_area?: FunctionalArea | null
          contact_id?: string | null
          output_delivery_method?: OutputDeliveryMethod | null
          output_delivery_details?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          name?: string
          jira_ticket?: string | null
          status?: ProcessStatus
          start_date?: string
          due_date?: string | null
          end_date?: string | null
          sdlc_stage?: SDLCStage
          estimate?: number | null
          dev_sprint?: string | null
          approval_status?: ApprovalStatus
          approved_date?: string | null
          deployed_date?: string | null
          functional_area?: FunctionalArea | null
          contact_id?: string | null
          output_delivery_method?: OutputDeliveryMethod | null
          output_delivery_details?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          customer_id: string
          name: string
          title: string | null
          email: string
          phone: string | null
          role: string | null
          type: ContactType
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          name: string
          title?: string | null
          email: string
          phone?: string | null
          role?: string | null
          type: ContactType
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          name?: string
          title?: string | null
          email?: string
          phone?: string | null
          role?: string | null
          type?: ContactType
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          customer_id: string
          name: string
          description: string | null
          url: string
          upload_date: string
          type: string | null
          category: DocumentCategory
          size: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          name: string
          description?: string | null
          url: string
          upload_date: string
          type?: string | null
          category: DocumentCategory
          size?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          name?: string
          description?: string | null
          url?: string
          upload_date?: string
          type?: string | null
          category?: DocumentCategory
          size?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      timeline_events: {
        Row: {
          id: string
          customer_id: string
          date: string
          title: string
          description: string | null
          type: string
          icon: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          date: string
          title: string
          description?: string | null
          type: string
          icon?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          date?: string
          title?: string
          description?: string | null
          type?: string
          icon?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      process_timeline_events: {
        Row: {
          id: string
          process_id: string
          date: string
          stage: SDLCStage
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          process_id: string
          date: string
          stage: SDLCStage
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          process_id?: string
          date?: string
          stage?: SDLCStage
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          name: string
          email: string
          role: UserRole
          avatar: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          role: UserRole
          avatar?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: UserRole
          avatar?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chat_sessions: {
        Row: {
          id: string
          title: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          content: string
          sender: string
          timestamp: string
          is_loading: boolean | null
        }
        Insert: {
          id?: string
          session_id: string
          content: string
          sender: string
          timestamp?: string
          is_loading?: boolean | null
        }
        Update: {
          id?: string
          session_id?: string
          content?: string
          sender?: string
          timestamp?: string
          is_loading?: boolean | null
        }
      }
      ollama_config: {
        Row: {
          id: number
          endpoint: string
          model: string
          temperature: number
          max_tokens: number
          use_system_prompt: boolean
          updated_at: string
        }
        Insert: {
          id?: number
          endpoint?: string
          model?: string
          temperature?: number
          max_tokens?: number
          use_system_prompt?: boolean
          updated_at?: string
        }
        Update: {
          id?: number
          endpoint?: string
          model?: string
          temperature?: number
          max_tokens?: number
          use_system_prompt?: boolean
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      CustomerPhase: 'Contracting' | 'New Activation' | 'Steady State' | 'Steady State + New Activation' | 'Pending Termination' | 'Terminated'
      SDLCStage: 'Requirements' | 'Design' | 'Development' | 'Testing' | 'Deployment' | 'Maintenance'
      ApprovalStatus: 'Pending' | 'Approved' | 'Rejected' | 'Not Required'
      ContactType: 'Client' | 'Internal'
      DocumentCategory: 'Contract' | 'Proposal' | 'Requirements' | 'Design' | 'Technical' | 'Report' | 'Invoice' | 'Other'
      UserRole: 'Admin' | 'Manager' | 'Viewer'
      ProcessStatus: 'Not Started' | 'In Progress' | 'Completed'
      FunctionalArea: 'Standard Data Ingestion' | 'Custom Data Ingestion' | 'Standard Extract' | 'Custom Extract' | 'CRM Refresh' | 'New Team Implementation'
      OutputDeliveryMethod: 'Email' | 'SFTP' | 'API' | 'Database' | 'SharePoint' | 'Other'
    }
  }
}

// Export enum types for use in the application
export type CustomerPhase = Database['public']['Enums']['CustomerPhase']
export type SDLCStage = Database['public']['Enums']['SDLCStage']
export type ApprovalStatus = Database['public']['Enums']['ApprovalStatus']
export type ContactType = Database['public']['Enums']['ContactType']
export type DocumentCategory = Database['public']['Enums']['DocumentCategory']
export type UserRole = Database['public']['Enums']['UserRole']
export type ProcessStatus = Database['public']['Enums']['ProcessStatus']
export type FunctionalArea = Database['public']['Enums']['FunctionalArea']
