# RETRO_CRM Data Migration Documentation

## Overview

This document provides detailed information about the data migration process from localStorage to the hosted Supabase instance. It covers the migration architecture, implementation details, and usage instructions.

## Migration Architecture

The migration process follows a three-tier architecture:

1. **User Interface Layer**: Provides a user-friendly interface for initiating and monitoring the migration process
2. **Migration Service Layer**: Handles the extraction, transformation, and loading of data
3. **Data Access Layer**: Interacts with both localStorage and Supabase

### Migration Flow

```
+-------------------+     +-------------------+     +-------------------+
|                   |     |                   |     |                   |
|   localStorage    |---->|  Migration Tool   |---->|     Supabase      |
|                   |     |                   |     |                   |
+-------------------+     +-------------------+     +-------------------+
        ^                         |                         |
        |                         v                         v
+-------------------+     +-------------------+     +-------------------+
|                   |     |                   |     |                   |
|  Existing Data    |     |  Data Validation  |     |  Migrated Data    |
|                   |     |                   |     |                   |
+-------------------+     +-------------------+     +-------------------+
```

## Implementation Details

### Database Schema

The Supabase database schema is designed based on the data model documentation. It includes the following tables:

1. **customers**: Stores customer information
2. **teams**: Stores team information associated with customers
3. **services**: Stores service information associated with customers
4. **projects**: Stores project information associated with customers
5. **processes**: Stores process information associated with customers
6. **contacts**: Stores contact information associated with customers
7. **documents**: Stores document information associated with customers
8. **timeline_events**: Stores timeline events associated with customers
9. **process_timeline_events**: Stores timeline events associated with processes
10. **chat_sessions**: Stores AI chat sessions
11. **chat_messages**: Stores messages within chat sessions
12. **ollama_config**: Stores Ollama configuration settings

All ID fields in the database use the TEXT data type instead of UUID to accommodate various ID formats from the application. This allows for more flexibility in ID generation and compatibility with existing data.

### Migration Utility

The migration utility (`src/lib/migration-utility.ts`) provides functions for:

1. **Data Extraction**: Retrieving data from localStorage
2. **Data Transformation**: Converting data to match the Supabase schema
3. **Data Loading**: Inserting data into Supabase tables
4. **Validation**: Ensuring data integrity during migration
5. **Error Handling**: Managing errors and providing fallback mechanisms

### Migration Tool

The migration tool (`src/components/DataMigration/MigrationTool.tsx`) provides a user interface for:

1. **Connection Verification**: Checking the connection to Supabase
2. **Data Overview**: Displaying a summary of data in localStorage
3. **Migration Options**: Allowing users to migrate all data or specific data types
4. **Progress Monitoring**: Showing the status and results of the migration process
5. **Error Reporting**: Displaying detailed error information if migration fails

## Usage Instructions

### Prerequisites

Before using the migration tool, ensure that:

1. You have created a Supabase project
2. You have set up the environment variables in a `.env` file:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. You have installed the required dependencies:
   ```
   npm install @supabase/supabase-js
   ```

### Accessing the Migration Tool

1. Navigate to the Migration page by clicking on the "Migration" button in the navigation bar
2. The migration tool will automatically check the connection to Supabase
3. If the connection is successful, you can proceed with the migration

### Performing the Migration

1. **Check Connection**: Verify that the application is connected to Supabase
2. **Review Data**: Check the summary of data in localStorage
3. **Select Migration Option**:
   - **Migrate All Data**: Migrates all data types at once
   - **Selective Migration**: Migrates only specific data types (customers, chat sessions, or Ollama configuration)
4. **Monitor Progress**: The migration tool will display the progress and results of the migration
5. **Verify Results**: Check the migration results to ensure all data was migrated successfully

### Troubleshooting

If you encounter issues during migration:

1. **Connection Issues**:
   - Check that your Supabase URL and API key are correct
   - Verify that your Supabase project is active
   - Check your network connection
   - Ensure CORS is properly configured in your Supabase project settings

2. **Migration Failures**:
   - Review the error messages displayed in the migration tool
   - Check the browser console for detailed error information
   - Try migrating specific data types individually to isolate the issue
   - Verify that the database schema matches the expected structure

3. **Data Validation Errors**:
   - Check that your localStorage data is valid and complete
   - Verify that the data structure matches the expected format
   - Consider resetting to mock data if your localStorage data is corrupted

4. **ID Format Issues**:
   - The database is configured to use TEXT type for ID fields to accommodate various ID formats
   - If you encounter ID-related errors, check that the database schema is correctly set up with TEXT type for ID fields

## Data Mapping

The following table shows how data is mapped from localStorage to Supabase:

| localStorage Key | Supabase Tables |
|------------------|-----------------|
| retro_crm_customers | customers, teams, services, projects, processes, contacts, documents, timeline_events, process_timeline_events |
| retro_crm_chat_sessions | chat_sessions, chat_messages |
| retro_crm_ollama_config | ollama_config |

### Customer Data Mapping

The customer data in localStorage is a nested structure that includes related entities. The migration utility extracts these entities and maps them to separate tables in Supabase:

```javascript
// Example localStorage customer data
{
  id: "c1",
  name: "Pixel Perfect Inc.",
  logo: undefined,
  avatarColor: "#6d28d9",
  phase: "Steady State",
  teams: [...],
  processes: [...],
  services: [...],
  contacts: [...],
  documents: [...],
  timeline: [...]
}

// Mapped to Supabase tables
// customers table
{
  id: "c1",
  name: "Pixel Perfect Inc.",
  logo: null,
  avatar_color: "#6d28d9",
  phase: "Steady State",
  contract_start_date: null,
  contract_end_date: null,
  created_at: "2025-05-20T12:00:00.000Z",
  updated_at: "2025-05-20T12:00:00.000Z"
}

// teams table
[
  {
    id: "t1",
    customer_id: "c1",
    name: "Development Team",
    finance_code: "DEV-001",
    created_at: "2025-05-20T12:00:00.000Z",
    updated_at: "2025-05-20T12:00:00.000Z"
  },
  ...
]

// Similar mappings for other related entities
```

## Conclusion

The data migration process provides a seamless way to transition from localStorage to a hosted Supabase instance. This enhances the application's data persistence, reliability, and accessibility across multiple devices. The migration tool offers a user-friendly interface for performing the migration, with detailed feedback and error handling to ensure a smooth transition.
