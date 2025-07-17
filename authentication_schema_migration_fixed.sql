-- Authentication Schema Migration - FIXED VERSION
-- Run this script to prepare the database for authentication
-- This version handles existing user table structure

-- First, let's check and potentially modify the users table structure
DO $$
BEGIN
    -- Check if users table exists and get its structure
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Add new authentication columns if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash') THEN
            ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active') THEN
            ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_login') THEN
            ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'failed_login_attempts') THEN
            ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'locked_until') THEN
            ALTER TABLE users ADD COLUMN locked_until TIMESTAMP;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified') THEN
            ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verification_token') THEN
            ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_reset_token') THEN
            ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_reset_expires') THEN
            ALTER TABLE users ADD COLUMN password_reset_expires TIMESTAMP;
        END IF;
        
        -- Add timestamps if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') THEN
            ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
            ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
        END IF;
        
        -- Add role column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
            ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'Viewer';
        END IF;
        
        RAISE NOTICE 'Users table structure updated successfully';
    ELSE
        -- Create users table if it doesn't exist
        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255),
            role VARCHAR(50) DEFAULT 'Viewer',
            is_active BOOLEAN DEFAULT true,
            last_login TIMESTAMP,
            failed_login_attempts INTEGER DEFAULT 0,
            locked_until TIMESTAMP,
            email_verified BOOLEAN DEFAULT false,
            email_verification_token VARCHAR(255),
            password_reset_token VARCHAR(255),
            password_reset_expires TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        RAISE NOTICE 'Users table created successfully';
    END IF;
END $$;

-- Get the data type of the users.id column
DO $$
DECLARE
    user_id_type text;
BEGIN
    SELECT data_type INTO user_id_type 
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'id';
    
    RAISE NOTICE 'Users table id column type: %', user_id_type;
END $$;

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user_roles junction table with dynamic foreign key based on users.id type
DO $$
DECLARE
    user_id_type text;
    fk_constraint_sql text;
BEGIN
    -- Get the actual data type of users.id
    SELECT data_type INTO user_id_type 
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'id';
    
    -- Drop table if it exists to recreate with correct type
    DROP TABLE IF EXISTS user_roles;
    
    -- Create table with matching user_id type
    IF user_id_type = 'uuid' THEN
        CREATE TABLE user_roles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
            assigned_by UUID REFERENCES users(id),
            assigned_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(user_id, role_id)
        );
    ELSIF user_id_type = 'text' OR user_id_type = 'character varying' THEN
        CREATE TABLE user_roles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
            assigned_by TEXT REFERENCES users(id),
            assigned_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(user_id, role_id)
        );
    ELSIF user_id_type = 'integer' THEN
        CREATE TABLE user_roles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
            assigned_by INTEGER REFERENCES users(id),
            assigned_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(user_id, role_id)
        );
    ELSE
        RAISE EXCEPTION 'Unsupported user_id type: %', user_id_type;
    END IF;
    
    RAISE NOTICE 'User_roles table created with user_id type: %', user_id_type;
END $$;

-- Create user_sessions table with matching user_id type
DO $$
DECLARE
    user_id_type text;
BEGIN
    SELECT data_type INTO user_id_type 
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'id';
    
    -- Drop table if it exists to recreate with correct type
    DROP TABLE IF EXISTS user_sessions;
    
    -- Create table with matching user_id type
    IF user_id_type = 'uuid' THEN
        CREATE TABLE user_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            session_token VARCHAR(255) UNIQUE NOT NULL,
            refresh_token VARCHAR(255) UNIQUE,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            last_used TIMESTAMP DEFAULT NOW(),
            ip_address INET,
            user_agent TEXT
        );
    ELSIF user_id_type = 'text' OR user_id_type = 'character varying' THEN
        CREATE TABLE user_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            session_token VARCHAR(255) UNIQUE NOT NULL,
            refresh_token VARCHAR(255) UNIQUE,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            last_used TIMESTAMP DEFAULT NOW(),
            ip_address INET,
            user_agent TEXT
        );
    ELSIF user_id_type = 'integer' THEN
        CREATE TABLE user_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            session_token VARCHAR(255) UNIQUE NOT NULL,
            refresh_token VARCHAR(255) UNIQUE,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            last_used TIMESTAMP DEFAULT NOW(),
            ip_address INET,
            user_agent TEXT
        );
    ELSE
        RAISE EXCEPTION 'Unsupported user_id type: %', user_id_type;
    END IF;
    
    RAISE NOTICE 'User_sessions table created with user_id type: %', user_id_type;
END $$;

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT, -- Keep as TEXT to accommodate any user_id type
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES 
('Admin', 'Full system access', '{
    "users": {"create": true, "read": true, "update": true, "delete": true},
    "customers": {"create": true, "read": true, "update": true, "delete": true},
    "processes": {"create": true, "read": true, "update": true, "delete": true},
    "services": {"create": true, "read": true, "update": true, "delete": true},
    "documents": {"create": true, "read": true, "update": true, "delete": true},
    "reports": {"create": true, "read": true, "update": true, "delete": true},
    "system": {"configure": true, "backup": true, "restore": true}
}'),
('Manager', 'Management access', '{
    "users": {"create": false, "read": true, "update": false, "delete": false},
    "customers": {"create": true, "read": true, "update": true, "delete": false},
    "processes": {"create": true, "read": true, "update": true, "delete": false},
    "services": {"create": true, "read": true, "update": true, "delete": false},
    "documents": {"create": true, "read": true, "update": true, "delete": false},
    "reports": {"create": true, "read": true, "update": false, "delete": false},
    "system": {"configure": false, "backup": false, "restore": false}
}'),
('Viewer', 'Read-only access', '{
    "users": {"create": false, "read": false, "update": false, "delete": false},
    "customers": {"create": false, "read": true, "update": false, "delete": false},
    "processes": {"create": false, "read": true, "update": false, "delete": false},
    "services": {"create": false, "read": true, "update": false, "delete": false},
    "documents": {"create": false, "read": true, "update": false, "delete": false},
    "reports": {"create": false, "read": true, "update": false, "delete": false},
    "system": {"configure": false, "backup": false, "restore": false}
}')
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text OR auth.jwt() ->> 'role' = 'Admin');

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid()::text = id::text OR auth.jwt() ->> 'role' = 'Admin');

CREATE POLICY "Only admins can create users" ON users
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'Admin');

CREATE POLICY "Only admins can delete users" ON users
    FOR DELETE USING (auth.jwt() ->> 'role' = 'Admin');

-- Create RLS policies for roles table
CREATE POLICY "Authenticated users can view roles" ON roles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can modify roles" ON roles
    FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'Admin');

-- Create RLS policies for user_roles table
CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (auth.uid()::text = user_id::text OR auth.jwt() ->> 'role' = 'Admin');

CREATE POLICY "Only admins can modify user roles" ON user_roles
    FOR ALL USING (auth.jwt() ->> 'role' = 'Admin');

-- Create RLS policies for user_sessions table
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (auth.uid()::text = user_id::text OR auth.jwt() ->> 'role' = 'Admin');

CREATE POLICY "Users can manage their own sessions" ON user_sessions
    FOR ALL USING (auth.uid()::text = user_id::text OR auth.jwt() ->> 'role' = 'Admin');

-- Create RLS policies for audit_logs table
CREATE POLICY "Only admins can view audit logs" ON audit_logs
    FOR SELECT USING (auth.jwt() ->> 'role' = 'Admin');

CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to roles table
DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate role assignments
CREATE OR REPLACE FUNCTION validate_role_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if role exists
    IF NOT EXISTS (SELECT 1 FROM roles WHERE id = NEW.role_id) THEN
        RAISE EXCEPTION 'Role does not exist';
    END IF;
    
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.user_id) THEN
        RAISE EXCEPTION 'User does not exist';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply role validation trigger
DROP TRIGGER IF EXISTS validate_role_assignment_trigger ON user_roles;
CREATE TRIGGER validate_role_assignment_trigger
    BEFORE INSERT OR UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION validate_role_assignment();

-- Create function to log authentication events
CREATE OR REPLACE FUNCTION log_auth_event(
    p_user_id TEXT,
    p_action VARCHAR(100),
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_logs (user_id, action, resource_type, ip_address, user_agent)
    VALUES (p_user_id, p_action, 'authentication', p_ip_address, p_user_agent);
END;
$$ language 'plpgsql';

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ language 'plpgsql';

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Authentication schema migration completed successfully!';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '- users (updated with auth columns)';
    RAISE NOTICE '- roles (with default Admin, Manager, Viewer roles)';
    RAISE NOTICE '- user_roles (junction table for RBAC)';
    RAISE NOTICE '- user_sessions (session management)';
    RAISE NOTICE '- audit_logs (security logging)';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Security features enabled:';
    RAISE NOTICE '- Row Level Security (RLS) policies';
    RAISE NOTICE '- Performance indexes';
    RAISE NOTICE '- Audit logging functions';
    RAISE NOTICE '- Session cleanup functions';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Configure environment variables';
    RAISE NOTICE '2. Start your application server';
    RAISE NOTICE '3. Test authentication endpoints';
    RAISE NOTICE '====================================';
END $$;