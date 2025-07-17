-- Supabase Data Migration Export
-- Generated on: 2025-07-16T19:16:32.788Z
-- Source: https://tavkgymcjrrobjircogi.supabase.co
-- Total tables: 24
-- Total rows: 0

-- Disable triggers and constraints during import
SET session_replication_role = replica;

-- Re-enable triggers and constraints
SET session_replication_role = DEFAULT;

-- Update sequences to prevent ID conflicts
-- (Add sequence updates as needed for specific tables)

-- Migration complete
SELECT 'Data migration completed successfully' as status;
