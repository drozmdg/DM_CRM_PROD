-- Sales Dashboard Database Schema
-- This file contains the complete database schema for the Sales Dashboard application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE customer_phase AS ENUM (
  'Contracting',
  'New Activation', 
  'Steady State',
  'Steady State + New Activation',
  'Pending Termination',
  'Terminated'
);

CREATE TYPE user_role AS ENUM ('Admin', 'Manager', 'Viewer');
CREATE TYPE contact_type AS ENUM ('Client', 'Internal');
CREATE TYPE document_category AS ENUM (
  'Contract',
  'Proposal', 
  'Requirements',
  'Design',
  'Technical',
  'Report',
  'Invoice',
  'Other'
);

CREATE TYPE sdlc_stage AS ENUM (
  'Requirements',
  'Design',
  'Development', 
  'Testing',
  'Deployment',
  'Maintenance'
);

CREATE TYPE approval_status AS ENUM (
  'Pending',
  'Approved',
  'Rejected',
  'Not Required'
);

CREATE TYPE functional_area AS ENUM (
  'Standard Data Ingestion',
  'Custom Data Ingestion',
  'Standard Extract',
  'Custom Extract', 
  'CRM Refresh',
  'New Team Implementation'
);

CREATE TYPE output_delivery_method AS ENUM (
  'Email',
  'SFTP',
  'API',
  'Database',
  'SharePoint',
  'Other',
  'none'
);

CREATE TYPE timeline_event_type AS ENUM (
  'phase-change',
  'project-added',
  'process-launched',
  'other'
);

CREATE TYPE process_status AS ENUM (
  'Not Started',
  'In Progress',
  'Completed'
);

-- Customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  logo TEXT,
  avatar_color VARCHAR(7), -- Hex color code
  phase customer_phase NOT NULL DEFAULT 'Contracting',
  contract_start_date DATE,
  contract_end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  finance_code VARCHAR(50) NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts table
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  role VARCHAR(255),
  type contact_type NOT NULL DEFAULT 'Client',
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Communications table
CREATE TABLE communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'phone', 'meeting', 'other')),
  subject VARCHAR(255) NOT NULL,
  notes TEXT NOT NULL,
  date VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  type VARCHAR(50), -- File type (PDF, DOCX, etc.)
  category document_category NOT NULL DEFAULT 'Other',
  size BIGINT, -- File size in bytes
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  monthly_hours INTEGER NOT NULL DEFAULT 0,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processes table
CREATE TABLE processes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  jira_ticket VARCHAR(100),
  status process_status NOT NULL DEFAULT 'Not Started',
  start_date DATE NOT NULL,
  due_date DATE,
  end_date DATE,
  sdlc_stage sdlc_stage NOT NULL DEFAULT 'Requirements',
  estimate INTEGER, -- Estimated hours
  dev_sprint VARCHAR(100),
  approval_status approval_status NOT NULL DEFAULT 'Not Required',
  approved_date DATE,
  deployed_date DATE,
  functional_area functional_area,
  contact_id UUID REFERENCES contacts(id),
  output_delivery_method output_delivery_method DEFAULT 'none',
  output_delivery_details TEXT,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Process timeline events table
CREATE TABLE process_timeline_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id UUID REFERENCES processes(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  stage sdlc_stage NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Timeline events table (for customer timeline)
CREATE TABLE timeline_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type timeline_event_type NOT NULL DEFAULT 'other',
  icon VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for process-team relationships
CREATE TABLE process_teams (
  process_id UUID REFERENCES processes(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  PRIMARY KEY (process_id, team_id)
);

-- Junction table for process-document relationships
CREATE TABLE process_documents (
  process_id UUID REFERENCES processes(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  PRIMARY KEY (process_id, document_id)
);

-- Junction table for project-process relationships
CREATE TABLE project_processes (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  process_id UUID REFERENCES processes(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, process_id)
);

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'Viewer',
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat sessions table
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'ai')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_customers_phase ON customers(phase);
CREATE INDEX idx_customers_created_at ON customers(created_at);
CREATE INDEX idx_teams_customer_id ON teams(customer_id);
CREATE INDEX idx_contacts_customer_id ON contacts(customer_id);
CREATE INDEX idx_contacts_type ON contacts(type);
CREATE INDEX idx_documents_customer_id ON documents(customer_id);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_services_customer_id ON services(customer_id);
CREATE INDEX idx_processes_customer_id ON processes(customer_id);
CREATE INDEX idx_processes_status ON processes(status);
CREATE INDEX idx_processes_sdlc_stage ON processes(sdlc_stage);
CREATE INDEX idx_process_timeline_events_process_id ON process_timeline_events(process_id);
CREATE INDEX idx_timeline_events_customer_id ON timeline_events(customer_id);
CREATE INDEX idx_timeline_events_date ON timeline_events(date);
CREATE INDEX idx_projects_customer_id ON projects(customer_id);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_processes_updated_at BEFORE UPDATE ON processes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security (RLS) policies will be added here when authentication is implemented
-- For now, we'll allow all operations for development
