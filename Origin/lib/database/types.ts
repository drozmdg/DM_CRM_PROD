/**
 * Database Types
 * 
 * This file contains type definitions for database operations.
 */

/**
 * Record counts for each table in the database
 */
export interface RecordCounts {
  customers: number;
  teams: number;
  services: number;
  processes: number;
  projects: number;
  contacts: number;
  documents: number;
  timeline_events: number;
  chat_sessions: number;
  chat_messages: number;
  [key: string]: number;
}

/**
 * Table names in the database
 */
export const TABLES = {
  // Junction tables (many-to-many relationships)
  JUNCTION: {
    PROJECT_PROCESS: 'project_process',
    PROJECT_SERVICE: 'project_service',
    PROJECT_TEAM: 'project_team',
    PROCESS_TEAM: 'process_team',
  },
  
  // Child tables with foreign keys
  CHILD: {
    CHAT_MESSAGES: 'chat_messages',
    PROCESS_TIMELINE_EVENTS: 'process_timeline_events',
    TIMELINE_EVENTS: 'timeline_events',
    DOCUMENTS: 'documents',
    CONTACTS: 'contacts',
    SERVICES: 'services',
    TEAMS: 'teams',
    PROCESSES: 'processes',
    PROJECTS: 'projects',
  },
  
  // Parent tables
  PARENT: {
    CHAT_SESSIONS: 'chat_sessions',
    CUSTOMERS: 'customers',
  },
  
  // Configuration tables
  CONFIG: {
    OLLAMA_CONFIG: 'ollama_config',
    USERS: 'users',
  }
};

/**
 * Order of tables for wiping the database
 * This order respects foreign key constraints
 */
export const WIPE_TABLE_ORDER = [
  // Junction tables (many-to-many relationships)
  TABLES.JUNCTION.PROJECT_PROCESS,
  TABLES.JUNCTION.PROJECT_SERVICE,
  TABLES.JUNCTION.PROJECT_TEAM,
  TABLES.JUNCTION.PROCESS_TEAM,

  // Child tables with foreign keys
  TABLES.CHILD.CHAT_MESSAGES,
  TABLES.CHILD.PROCESS_TIMELINE_EVENTS,
  TABLES.CHILD.TIMELINE_EVENTS,
  TABLES.CHILD.DOCUMENTS,
  TABLES.CHILD.CONTACTS,
  TABLES.CHILD.SERVICES,
  TABLES.CHILD.TEAMS,
  TABLES.CHILD.PROCESSES,
  TABLES.CHILD.PROJECTS,

  // Parent tables
  TABLES.PARENT.CHAT_SESSIONS,
  TABLES.PARENT.CUSTOMERS,
];

/**
 * Tables to include in record counts
 */
export const COUNT_TABLES = [
  TABLES.PARENT.CUSTOMERS,
  TABLES.CHILD.TEAMS,
  TABLES.CHILD.SERVICES,
  TABLES.CHILD.PROCESSES,
  TABLES.CHILD.PROJECTS,
  TABLES.CHILD.CONTACTS,
  TABLES.CHILD.DOCUMENTS,
  TABLES.CHILD.TIMELINE_EVENTS,
  TABLES.PARENT.CHAT_SESSIONS,
  TABLES.CHILD.CHAT_MESSAGES,
];
