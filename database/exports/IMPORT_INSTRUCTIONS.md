# Supabase Data Import Instructions

## Files Generated

1. `supabase-export-1752693392790.json` - Complete JSON backup of exported data
2. `02-import-supabase-data.sql` - SQL script to import data into PostgreSQL

## How to Import Data

### Option 1: Using Docker Compose (Recommended)

1. Place the SQL file in the `database/migrations/` directory
2. Start the PostgreSQL container:
   ```bash
   docker-compose up database
   ```
3. The migration will run automatically

### Option 2: Manual Import

1. Connect to your PostgreSQL database
2. Run the schema migration first:
   ```bash
   psql -d sales_dashboard -f database/migrations/01-init-complete-schema.sql
   ```
3. Import the data:
   ```bash
   psql -d sales_dashboard -f database/exports/02-import-supabase-data.sql
   ```

## Export Summary

- **Date**: 2025-07-16T19:16:32.790Z
- **Source**: https://tavkgymcjrrobjircogi.supabase.co
- **Tables Exported**: 0/24
- **Total Rows**: 0
- **Failed Tables**: users, roles, user_roles, customers, contacts, contact_customer_assignments, teams, pharmaceutical_products, services, processes, process_tasks, process_milestones, process_team, process_file_transfers, process_notifications, documents, timeline_events, customer_notes, customer_important_dates, ai_chat_sessions, ai_chat_messages, communications, user_sessions, audit_logs

## Verification

After import, verify the data:

```sql
-- Check table row counts
SELECT 
  schemaname, 
  tablename, 
  n_tup_ins as row_count 
FROM pg_stat_user_tables 
ORDER BY tablename;

-- Test health check
SELECT * FROM health_check();
```
