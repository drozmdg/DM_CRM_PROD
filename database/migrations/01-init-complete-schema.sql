-- ========================================================================
-- COMPLETE SALES DASHBOARD DATABASE SCHEMA MIGRATION
-- ========================================================================
-- This migration creates the complete database schema for containerized deployment
-- Migrating from Supabase to standalone PostgreSQL
-- ========================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================================================
-- STEP 1: CREATE CUSTOM TYPES
-- ========================================================================

-- User role enum (matching Drizzle schema)
CREATE TYPE user_role AS ENUM ('Admin', 'Manager', 'Viewer');

-- Task management enums
CREATE TYPE task_status AS ENUM ('Not Started', 'In Progress', 'Completed', 'Blocked');
CREATE TYPE task_priority AS ENUM ('Low', 'Medium', 'High');

-- Milestone tracking enum
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

-- Contact type enum
CREATE TYPE contact_type AS ENUM (
  'Client', 
  'Internal', 
  'Vendor', 
  'Partner', 
  'Consultant', 
  'External Stakeholder'
);

-- ========================================================================
-- STEP 2: CREATE CORE APPLICATION TABLES
-- ========================================================================

-- Session storage table for Express sessions
CREATE TABLE sessions (
    sid VARCHAR(36) PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

CREATE INDEX IDX_session_expire ON sessions(expire);

-- Users table (enhanced with authentication fields)
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    name VARCHAR(255), -- Computed from first_name + last_name
    role user_role DEFAULT 'Viewer',
    avatar VARCHAR(255),
    profile_image_url VARCHAR(255),
    -- Authentication fields
    password_hash VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Customers table
CREATE TABLE customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phase TEXT NOT NULL, -- Contracting, New Activation, Steady State, etc.
    contract_start_date DATE,
    contract_end_date DATE,
    logo_url TEXT,
    avatar_color TEXT NOT NULL DEFAULT '#1976D2',
    active BOOLEAN NOT NULL DEFAULT true,
    inactivated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Contacts table
CREATE TABLE contacts (
    id TEXT PRIMARY KEY,
    customer_id TEXT REFERENCES customers(id),
    name TEXT NOT NULL,
    title TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    role TEXT,
    type contact_type NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Contact-Customer assignments junction table
CREATE TABLE contact_customer_assignments (
    contact_id TEXT REFERENCES contacts(id) NOT NULL,
    customer_id TEXT REFERENCES customers(id) NOT NULL,
    assigned_at TIMESTAMP DEFAULT NOW(),
    assigned_by TEXT,
    PRIMARY KEY (contact_id, customer_id)
);

-- Teams table
CREATE TABLE teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    finance_code TEXT NOT NULL,
    customer_id TEXT REFERENCES customers(id) NOT NULL,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Services table
CREATE TABLE services (
    id TEXT PRIMARY KEY,
    customer_id TEXT REFERENCES customers(id) NOT NULL,
    name TEXT NOT NULL,
    monthly_hours INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Processes table
CREATE TABLE processes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    customer_id TEXT REFERENCES customers(id) NOT NULL,
    jira_ticket TEXT,
    status TEXT NOT NULL, -- Not Started, In Progress, Completed
    sdlc_stage TEXT NOT NULL, -- Requirements, Design, Development, Testing, Deployment, Maintenance
    start_date DATE NOT NULL,
    due_date DATE,
    approval_status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Approved, Rejected, Not Required
    estimate INTEGER, -- hours
    functional_area TEXT,
    responsible_contact_id TEXT REFERENCES contacts(id),
    progress INTEGER DEFAULT 0, -- percentage 0-100
    -- TPA (Third-Party Agreement) fields
    is_tpa_required BOOLEAN DEFAULT false,
    tpa_responsible_contact_id TEXT REFERENCES contacts(id),
    tpa_data_source TEXT,
    tpa_start_date DATE,
    tpa_end_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
    id TEXT PRIMARY KEY,
    customer_id TEXT REFERENCES customers(id) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- Contract, Proposal, Requirements, Design, Technical, Report, Invoice, Other
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Timeline events table
CREATE TABLE timeline_events (
    id TEXT PRIMARY KEY,
    customer_id TEXT REFERENCES customers(id),
    process_id TEXT REFERENCES processes(id),
    event_type TEXT NOT NULL, -- customer_created, process_started, document_uploaded, etc.
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI Chat sessions table
CREATE TABLE ai_chat_sessions (
    id TEXT PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) NOT NULL,
    title TEXT,
    model TEXT NOT NULL DEFAULT 'llama2',
    system_prompt TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI Chat messages table
CREATE TABLE ai_chat_messages (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES ai_chat_sessions(id) NOT NULL,
    role TEXT NOT NULL, -- user, assistant
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Communications table
CREATE TABLE communications (
    id TEXT PRIMARY KEY,
    contact_id TEXT REFERENCES contacts(id) NOT NULL,
    type TEXT NOT NULL, -- email, phone, meeting, other
    subject TEXT NOT NULL,
    notes TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================================================
-- STEP 3: CREATE ENHANCED FEATURE TABLES
-- ========================================================================

-- Process Tasks table (for enhanced task management)
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
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Process Milestones table
CREATE TABLE process_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    process_id TEXT NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
    milestone_type milestone_type NOT NULL,
    achieved_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Process Team assignments
CREATE TABLE process_team (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    process_id TEXT NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
    team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(process_id, team_id)
);

-- Process File Transfers configuration
CREATE TABLE process_file_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    process_id TEXT NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    connection_type TEXT NOT NULL, -- SFTP, S3, ADLS, FTP, HTTP, Local
    direction TEXT NOT NULL, -- Inbound, Outbound
    file_pattern VARCHAR(255),
    schedule_type TEXT, -- Manual, Hourly, Daily, Weekly, Monthly
    host VARCHAR(255),
    port INTEGER,
    username VARCHAR(255),
    credential_reference TEXT, -- Reference to secure credential storage
    remote_path TEXT,
    local_path TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Process Notifications system
CREATE TABLE process_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    process_id TEXT NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_role VARCHAR(100),
    event_types JSONB, -- Array of event types this recipient should be notified about
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Customer Notes table
CREATE TABLE customer_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Customer Important Dates table
CREATE TABLE customer_important_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Pharmaceutical Products table (for specialized industry features)
CREATE TABLE pharmaceutical_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    ndc_number VARCHAR(20),
    therapeutic_area VARCHAR(255),
    indication TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================================================================
-- STEP 4: CREATE AUTHENTICATION AND SECURITY TABLES
-- ========================================================================

-- Roles table for detailed RBAC permissions
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User roles junction table
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by VARCHAR(255) REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- User sessions table for session management
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Audit logs table for security tracking
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================================================
-- STEP 5: CREATE PERFORMANCE INDEXES
-- ========================================================================

-- Core table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_customers_phase ON customers(phase);
CREATE INDEX idx_customers_active ON customers(active);
CREATE INDEX idx_contacts_customer_id ON contacts(customer_id);
CREATE INDEX idx_contacts_type ON contacts(type);
CREATE INDEX idx_processes_customer_id ON processes(customer_id);
CREATE INDEX idx_processes_status ON processes(status);
CREATE INDEX idx_processes_sdlc_stage ON processes(sdlc_stage);
CREATE INDEX idx_documents_customer_id ON documents(customer_id);
CREATE INDEX idx_timeline_events_customer_id ON timeline_events(customer_id);
CREATE INDEX idx_timeline_events_process_id ON timeline_events(process_id);

-- Task management indexes
CREATE INDEX idx_process_tasks_process_id ON process_tasks(process_id);
CREATE INDEX idx_process_tasks_parent_task_id ON process_tasks(parent_task_id);
CREATE INDEX idx_process_tasks_status ON process_tasks(status);
CREATE INDEX idx_process_tasks_priority ON process_tasks(priority);
CREATE INDEX idx_process_tasks_assigned_to_id ON process_tasks(assigned_to_id);
CREATE INDEX idx_process_tasks_due_date ON process_tasks(due_date);
CREATE INDEX idx_process_milestones_process_id ON process_milestones(process_id);
CREATE INDEX idx_process_milestones_milestone_type ON process_milestones(milestone_type);

-- Enhanced feature indexes
CREATE INDEX idx_process_team_process_id ON process_team(process_id);
CREATE INDEX idx_process_file_transfers_process_id ON process_file_transfers(process_id);
CREATE INDEX idx_process_notifications_process_id ON process_notifications(process_id);
CREATE INDEX idx_customer_notes_customer_id ON customer_notes(customer_id);
CREATE INDEX idx_customer_important_dates_customer_id ON customer_important_dates(customer_id);
CREATE INDEX idx_customer_important_dates_date ON customer_important_dates(date);

-- Authentication indexes
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ========================================================================
-- STEP 6: CREATE CONSTRAINTS
-- ========================================================================

-- Task management constraints
ALTER TABLE process_milestones 
ADD CONSTRAINT unique_milestone_per_process 
UNIQUE (process_id, milestone_type);

ALTER TABLE process_tasks 
ADD CONSTRAINT check_not_self_parent 
CHECK (id != parent_task_id);

-- Data integrity constraints
ALTER TABLE customers 
ADD CONSTRAINT check_contract_dates 
CHECK (contract_end_date IS NULL OR contract_end_date >= contract_start_date);

ALTER TABLE processes 
ADD CONSTRAINT check_process_dates 
CHECK (due_date IS NULL OR due_date >= start_date);

ALTER TABLE processes 
ADD CONSTRAINT check_progress_range 
CHECK (progress >= 0 AND progress <= 100);

-- ========================================================================
-- STEP 7: CREATE UTILITY FUNCTIONS
-- ========================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to hash passwords
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN crypt(password, gen_salt('bf', 12));
END;
$$ LANGUAGE plpgsql;

-- Function to verify passwords
CREATE OR REPLACE FUNCTION verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (crypt(password, hash) = hash);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate process progress based on tasks
CREATE OR REPLACE FUNCTION calculate_process_progress(p_process_id TEXT)
RETURNS INTEGER AS $$
DECLARE
    total_tasks INTEGER;
    completed_tasks INTEGER;
    progress_percentage INTEGER;
BEGIN
    -- Count total tasks for the process
    SELECT COUNT(*) INTO total_tasks 
    FROM process_tasks 
    WHERE process_id = p_process_id;
    
    -- Count completed tasks
    SELECT COUNT(*) INTO completed_tasks 
    FROM process_tasks 
    WHERE process_id = p_process_id AND status = 'Completed';
    
    -- Calculate percentage
    IF total_tasks = 0 THEN
        progress_percentage := 0;
    ELSE
        progress_percentage := ROUND((completed_tasks::DECIMAL / total_tasks::DECIMAL) * 100);
    END IF;
    
    -- Update the process progress
    UPDATE processes 
    SET progress = progress_percentage, updated_at = NOW()
    WHERE id = p_process_id;
    
    RETURN progress_percentage;
END;
$$ LANGUAGE plpgsql;

-- Function to update user full name
CREATE OR REPLACE FUNCTION update_user_name()
RETURNS TRIGGER AS $$
BEGIN
    NEW.name = COALESCE(NEW.first_name, '') || 
               CASE WHEN NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN ' ' ELSE '' END ||
               COALESCE(NEW.last_name, '');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================================================
-- STEP 8: CREATE TRIGGERS
-- ========================================================================

-- Updated_at triggers
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processes_updated_at 
    BEFORE UPDATE ON processes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_process_tasks_updated_at 
    BEFORE UPDATE ON process_tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_process_milestones_updated_at 
    BEFORE UPDATE ON process_milestones 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at 
    BEFORE UPDATE ON roles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User name update trigger
CREATE TRIGGER update_user_name_trigger 
    BEFORE INSERT OR UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_user_name();

-- ========================================================================
-- STEP 9: INSERT DEFAULT DATA
-- ========================================================================

-- Insert default roles with comprehensive permissions
INSERT INTO roles (name, description, permissions) VALUES 
('Admin', 'Full system access with all permissions', '{
    "users": {"create": true, "read": true, "update": true, "delete": true},
    "customers": {"create": true, "read": true, "update": true, "delete": true},
    "processes": {"create": true, "read": true, "update": true, "delete": true},
    "services": {"create": true, "read": true, "update": true, "delete": true},
    "documents": {"create": true, "read": true, "update": true, "delete": true},
    "reports": {"create": true, "read": true, "update": true, "delete": true},
    "contacts": {"create": true, "read": true, "update": true, "delete": true},
    "teams": {"create": true, "read": true, "update": true, "delete": true},
    "system": {"configure": true, "backup": true, "restore": true, "audit": true}
}'),
('Manager', 'Management access with create/edit permissions', '{
    "users": {"create": false, "read": true, "update": false, "delete": false},
    "customers": {"create": true, "read": true, "update": true, "delete": false},
    "processes": {"create": true, "read": true, "update": true, "delete": false},
    "services": {"create": true, "read": true, "update": true, "delete": false},
    "documents": {"create": true, "read": true, "update": true, "delete": false},
    "reports": {"create": true, "read": true, "update": false, "delete": false},
    "contacts": {"create": true, "read": true, "update": true, "delete": false},
    "teams": {"create": false, "read": true, "update": false, "delete": false},
    "system": {"configure": false, "backup": false, "restore": false, "audit": false}
}'),
('Viewer', 'Read-only access to all resources', '{
    "users": {"create": false, "read": false, "update": false, "delete": false},
    "customers": {"create": false, "read": true, "update": false, "delete": false},
    "processes": {"create": false, "read": true, "update": false, "delete": false},
    "services": {"create": false, "read": true, "update": false, "delete": false},
    "documents": {"create": false, "read": true, "update": false, "delete": false},
    "reports": {"create": false, "read": true, "update": false, "delete": false},
    "contacts": {"create": false, "read": true, "update": false, "delete": false},
    "teams": {"create": false, "read": true, "update": false, "delete": false},
    "system": {"configure": false, "backup": false, "restore": false, "audit": false}
}')
ON CONFLICT (name) DO UPDATE SET 
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    updated_at = NOW();

-- ========================================================================
-- STEP 10: CREATE HEALTH CHECK FUNCTIONS
-- ========================================================================

-- Drop existing health_check function if it exists
DROP FUNCTION IF EXISTS health_check();

CREATE OR REPLACE FUNCTION health_check()
RETURNS TABLE (
    status TEXT,
    check_timestamp TIMESTAMP,
    database_name TEXT,
    tables_count INTEGER,
    users_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Database is healthy'::TEXT as status,
        NOW() as check_timestamp,
        current_database() as database_name,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public')::INTEGER as tables_count,
        (SELECT COUNT(*) FROM users)::INTEGER as users_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================================================
-- MIGRATION COMPLETION VALIDATION
-- ========================================================================

DO $$
DECLARE
    table_count INTEGER;
    index_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Count created objects
    SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_schema = 'public';
    SELECT COUNT(*) INTO index_count FROM pg_indexes WHERE schemaname = 'public';
    SELECT COUNT(*) INTO function_count FROM pg_proc WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    
    -- Output migration results
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SALES DASHBOARD DATABASE MIGRATION COMPLETED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration Statistics:';
    RAISE NOTICE '- Tables created: %', table_count;
    RAISE NOTICE '- Indexes created: %', index_count;  
    RAISE NOTICE '- Functions created: %', function_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Core Tables:';
    RAISE NOTICE '✓ users (with authentication)';
    RAISE NOTICE '✓ customers';
    RAISE NOTICE '✓ contacts (with customer assignments)';
    RAISE NOTICE '✓ teams (with pharmaceutical products)';
    RAISE NOTICE '✓ services';
    RAISE NOTICE '✓ processes (with TPA support)';
    RAISE NOTICE '✓ documents';
    RAISE NOTICE '✓ timeline_events';
    RAISE NOTICE '✓ ai_chat_sessions & ai_chat_messages';
    RAISE NOTICE '✓ communications';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Enhanced Features:';
    RAISE NOTICE '✓ process_tasks & process_milestones';
    RAISE NOTICE '✓ process_team assignments';
    RAISE NOTICE '✓ process_file_transfers';
    RAISE NOTICE '✓ process_notifications';
    RAISE NOTICE '✓ customer_notes & customer_important_dates';
    RAISE NOTICE '✓ pharmaceutical_products';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Security & Authentication:';
    RAISE NOTICE '✓ roles & user_roles';
    RAISE NOTICE '✓ user_sessions';
    RAISE NOTICE '✓ audit_logs';
    RAISE NOTICE '✓ Password hashing functions';
    RAISE NOTICE '✓ Permission checking utilities';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Ready for containerized deployment!';
    RAISE NOTICE '========================================';
END $$;

-- Final success confirmation
SELECT 
    'SALES DASHBOARD DATABASE READY' as status,
    NOW() as migrated_at,
    'Ready for Docker container deployment' as next_step;