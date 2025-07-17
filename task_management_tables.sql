-- Task Management and Milestone Tracking Tables
-- Run this script in your Supabase SQL editor to create the new tables

-- Create new enum types for task management
CREATE TYPE task_status AS ENUM (
  'Not Started',
  'In Progress', 
  'Completed',
  'Blocked'
);

CREATE TYPE task_priority AS ENUM (
  'Low',
  'Medium',
  'High'
);

CREATE TYPE milestone_type AS ENUM (
  'Requirements Complete',
  'Requirements Approved External',
  'Requirements Approved Internal',
  'Estimate Provided',
  'Sprint Confirmed',
  'UAT Started',
  'UAT Approved',
  'Deployment Date',
  'Production Release Date'
);

-- Update contact_type enum to include new types
ALTER TYPE contact_type ADD VALUE 'Vendor';
ALTER TYPE contact_type ADD VALUE 'Partner';
ALTER TYPE contact_type ADD VALUE 'Consultant';
ALTER TYPE contact_type ADD VALUE 'External Stakeholder';

-- Process Tasks table
CREATE TABLE process_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id TEXT NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES process_tasks(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'Not Started',
  priority task_priority NOT NULL DEFAULT 'Medium',
  assigned_to_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  due_date DATE,
  completed_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Process Milestones table
CREATE TABLE process_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id TEXT NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  milestone_type milestone_type NOT NULL,
  achieved_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_process_tasks_process_id ON process_tasks(process_id);
CREATE INDEX idx_process_tasks_parent_task_id ON process_tasks(parent_task_id);
CREATE INDEX idx_process_tasks_status ON process_tasks(status);
CREATE INDEX idx_process_tasks_priority ON process_tasks(priority);
CREATE INDEX idx_process_tasks_assigned_to_id ON process_tasks(assigned_to_id);
CREATE INDEX idx_process_tasks_due_date ON process_tasks(due_date);

CREATE INDEX idx_process_milestones_process_id ON process_milestones(process_id);
CREATE INDEX idx_process_milestones_milestone_type ON process_milestones(milestone_type);
CREATE INDEX idx_process_milestones_achieved_date ON process_milestones(achieved_date);

-- Add updated_at triggers
CREATE TRIGGER update_process_tasks_updated_at 
  BEFORE UPDATE ON process_tasks 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_process_milestones_updated_at 
  BEFORE UPDATE ON process_milestones 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Add table comments
COMMENT ON TABLE process_tasks IS 'Tracks tasks and subtasks for processes with progress monitoring';
COMMENT ON TABLE process_milestones IS 'Tracks key project milestones for duration calculation';

-- Grant permissions for public access (demo mode)
-- These are the same permissions we learned from the customer notes setup

-- Grant all privileges to anon role (for demo mode)
GRANT ALL PRIVILEGES ON process_tasks TO anon;
GRANT ALL PRIVILEGES ON process_milestones TO anon;

-- Grant all privileges to authenticated role 
GRANT ALL PRIVILEGES ON process_tasks TO authenticated;
GRANT ALL PRIVILEGES ON process_milestones TO authenticated;

-- Grant all privileges to public role
GRANT ALL PRIVILEGES ON process_tasks TO public;
GRANT ALL PRIVILEGES ON process_milestones TO public;

-- Grant usage on the new enums
GRANT USAGE ON TYPE task_status TO anon, authenticated, public;
GRANT USAGE ON TYPE task_priority TO anon, authenticated, public;
GRANT USAGE ON TYPE milestone_type TO anon, authenticated, public;

-- Ensure sequence permissions for UUIDs
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, public;

-- Add constraint to ensure milestone uniqueness per process
ALTER TABLE process_milestones 
ADD CONSTRAINT unique_milestone_per_process 
UNIQUE (process_id, milestone_type);

-- Add constraint to prevent tasks from being their own parent
ALTER TABLE process_tasks 
ADD CONSTRAINT check_not_self_parent 
CHECK (id != parent_task_id);

-- Sample data for testing (optional - remove in production)
-- This creates sample tasks for process-1750187802396
INSERT INTO process_tasks (process_id, title, description, status, priority) VALUES
('process-1750187802396', 'Setup Development Environment', 'Configure local development environment and tools', 'Completed', 'High'),
('process-1750187802396', 'Database Design', 'Design database schema and relationships', 'In Progress', 'High'),
('process-1750187802396', 'API Development', 'Implement REST API endpoints', 'Not Started', 'Medium'),
('process-1750187802396', 'Frontend Components', 'Build React components', 'Not Started', 'Medium'),
('process-1750187802396', 'Testing', 'Write unit and integration tests', 'Not Started', 'Low');

-- Sample milestones
INSERT INTO process_milestones (process_id, milestone_type, achieved_date, notes) VALUES
('process-1750187802396', 'Requirements Complete', '2024-01-15', 'All requirements documented and reviewed'),
('process-1750187802396', 'Requirements Approved Internal', '2024-01-18', 'Internal team approved requirements');

-- Verify the tables were created successfully
SELECT 'Process Tasks table created successfully' as status
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'process_tasks');

SELECT 'Process Milestones table created successfully' as status  
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'process_milestones');

-- Display counts
SELECT 
  'Sample data inserted' as status,
  (SELECT COUNT(*) FROM process_tasks) as task_count,
  (SELECT COUNT(*) FROM process_milestones) as milestone_count;