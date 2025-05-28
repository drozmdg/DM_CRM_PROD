/**
 * Migration Types
 * 
 *export const LOCAL_STORAGE_KEYS = {
  CUSTOMERS: 'dm_crm_customers',
  CHAT_SESSIONS: 'dm_crm_chat_sessions',
  OLLAMA_CONFIG: 'dm_crm_ollama_config'
}; file contains types used by the migration utilities.
 */

/**
 * Migration status interface
 */
export interface MigrationStatus {
  success: boolean;
  message: string;
  details?: {
    customersCount?: number;
    teamsCount?: number;
    servicesCount?: number;
    processesCount?: number;
    contactsCount?: number;
    documentsCount?: number;
    timelineEventsCount?: number;
    chatSessionsCount?: number;
    chatMessagesCount?: number;
  };
  error?: any;
}

/**
 * Storage keys for localStorage
 */
export const STORAGE_KEYS = {
  CUSTOMERS: 'dm_crm_customers',
  CHAT_SESSIONS: 'dm_crm_chat_sessions',
  OLLAMA_CONFIG: 'dm_crm_ollama_config'
};
