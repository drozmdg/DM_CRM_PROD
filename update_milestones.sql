-- Update Milestone Types
-- Run this script in your Supabase SQL editor to update the milestone types

-- First, we need to update the milestone_type enum
-- Since PostgreSQL doesn't allow dropping enum values that are in use,
-- we'll create a new enum and migrate the data

-- Create new milestone enum with updated values
CREATE TYPE milestone_type_new AS ENUM (
  'Requirements Complete',
  'Requirements Approved Client',
  'Requirements Approved Dev',
  'Estimate Received',
  'Estimate Internal Partner Review',
  'Estimate Internal Approval Received',
  'Sprint(s) Confirmed',
  'Development Started',
  'Development Completed',
  'UAT Started',
  'UAT Approved',
  'Deployment Date',
  'Production Release Date',
  'Process Implementation Complete'
);

-- Add a temporary column with the new type
ALTER TABLE process_milestones 
ADD COLUMN milestone_type_temp milestone_type_new;

-- Update the temporary column with mapped values
UPDATE process_milestones 
SET milestone_type_temp = CASE milestone_type::text
  WHEN 'Requirements Approved External' THEN 'Requirements Approved Client'::milestone_type_new
  WHEN 'Requirements Approved Internal' THEN 'Requirements Approved Dev'::milestone_type_new
  WHEN 'Estimate Provided' THEN 'Estimate Received'::milestone_type_new
  WHEN 'Sprint Confirmed' THEN 'Sprint(s) Confirmed'::milestone_type_new
  ELSE milestone_type::text::milestone_type_new
END;

-- Drop the old column
ALTER TABLE process_milestones DROP COLUMN milestone_type;

-- Rename the temporary column
ALTER TABLE process_milestones 
RENAME COLUMN milestone_type_temp TO milestone_type;

-- Drop the old enum type
DROP TYPE milestone_type CASCADE;

-- Rename the new enum to the original name
ALTER TYPE milestone_type_new RENAME TO milestone_type;

-- Add back any constraints if needed
-- Update the unique constraint to use the new column
ALTER TABLE process_milestones 
DROP CONSTRAINT IF EXISTS unique_milestone_per_process;

ALTER TABLE process_milestones 
ADD CONSTRAINT unique_milestone_per_process 
UNIQUE (process_id, milestone_type);

-- Verify the update worked
SELECT DISTINCT milestone_type FROM process_milestones;

-- Display the new enum values
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'milestone_type'::regtype 
ORDER BY enumsortorder;