-- Authentication Schema Migration
-- Run this script to prepare the database for authentication

-- 1. Update users table for authentication
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 2. Create roles table for RBAC
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- 4. Create user_sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
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

-- 5. Create audit_logs table for security tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
('Admin', 'Full system access', '{"*": ["create", "read", "update", "delete"]}'),
('Manager', 'Management access to most features', '{"customers": ["read", "update"], "processes": ["create", "read", "update"], "services": ["read", "update"], "contacts": ["create", "read", "update"], "documents": ["create", "read", "update"], "timeline": ["read"], "dashboard": ["read"]}'),
('Viewer', 'Read-only access to most features', '{"customers": ["read"], "processes": ["read"], "services": ["read"], "contacts": ["read"], "documents": ["read"], "timeline": ["read"], "dashboard": ["read"]}')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  updated_at = NOW();

-- 7. Create function to automatically assign default role to new users
CREATE OR REPLACE FUNCTION assign_default_role()
RETURNS TRIGGER AS $$
DECLARE
  default_role_id UUID;
BEGIN
  -- Get default role (Viewer)
  SELECT id INTO default_role_id FROM roles WHERE name = 'Viewer' LIMIT 1;
  
  -- Assign default role to new user
  IF default_role_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id)
    VALUES (NEW.id, default_role_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to assign default role
DROP TRIGGER IF EXISTS trigger_assign_default_role ON users;
CREATE TRIGGER trigger_assign_default_role
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION assign_default_role();

-- 9. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create triggers for updated_at
DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_roles_updated_at ON roles;
CREATE TRIGGER trigger_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 11. Enable Row Level Security (RLS) on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_important_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_file_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmaceutical_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_pharmaceutical_products ENABLE ROW LEVEL SECURITY;

-- 12. Create comprehensive RLS policies for all operations
-- All authenticated users can read, Managers+ can modify

-- CUSTOMERS table policies
CREATE POLICY "All authenticated users can view customers" ON customers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can create customers" ON customers
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id 
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('Admin', 'Manager')
    )
  );

CREATE POLICY "Managers can update customers" ON customers
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id 
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('Admin', 'Manager')
    )
  );

CREATE POLICY "Admins can delete customers" ON customers
  FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id 
      WHERE ur.user_id = auth.uid() 
      AND r.name = 'Admin'
    )
  );

-- PROCESSES table policies
CREATE POLICY "All authenticated users can view processes" ON processes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can create processes" ON processes
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id 
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('Admin', 'Manager')
    )
  );

CREATE POLICY "Managers can update processes" ON processes
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id 
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('Admin', 'Manager')
    )
  );

CREATE POLICY "Admins can delete processes" ON processes
  FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id 
      WHERE ur.user_id = auth.uid() 
      AND r.name = 'Admin'
    )
  );

-- SERVICES table policies
CREATE POLICY "All authenticated users can view services" ON services
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can modify services" ON services
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id 
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('Admin', 'Manager')
    )
  );

-- CONTACTS table policies
CREATE POLICY "All authenticated users can view contacts" ON contacts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can modify contacts" ON contacts
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id 
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('Admin', 'Manager')
    )
  );

-- DOCUMENTS table policies
CREATE POLICY "All authenticated users can view documents" ON documents
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can modify documents" ON documents
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id 
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('Admin', 'Manager')
    )
  );

-- TIMELINE EVENTS table policies
CREATE POLICY "All authenticated users can view timeline events" ON timeline_events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can modify timeline events" ON timeline_events
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id 
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('Admin', 'Manager')
    )
  );

-- PROCESS TIMELINE EVENTS table policies  
CREATE POLICY "All authenticated users can view process timeline events" ON process_timeline_events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can modify process timeline events" ON process_timeline_events
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id 
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('Admin', 'Manager')
    )
  );

-- Additional table policies (customer notes, tasks, etc.)
CREATE POLICY "All authenticated users can view customer notes" ON customer_notes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can modify customer notes" ON customer_notes
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id 
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('Admin', 'Manager')
    )
  );

-- Secure access to user management tables
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE ur.user_id = auth.uid() 
    AND r.name IN ('Admin', 'Manager')
  ));

CREATE POLICY "Admins can modify users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id 
      WHERE ur.user_id = auth.uid() 
      AND r.name = 'Admin'
    )
  );

-- 13. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- 14. Default admin user creation (DEVELOPMENT ONLY)
-- WARNING: This creates a default admin user for development purposes only
-- For production deployment:
-- 1. Comment out this entire section
-- 2. Create admin users manually through the registration endpoint
-- 3. Use proper production credentials

-- Uncomment the following block ONLY for development/testing
/*
DO $$
DECLARE
  admin_user_id UUID;
  admin_role_id UUID;
BEGIN
  -- Only create if we're in development mode
  IF COALESCE(current_setting('app.environment', true), 'development') = 'development' THEN
    -- Check if any admin user already exists
    SELECT u.id INTO admin_user_id 
    FROM users u 
    JOIN user_roles ur ON u.id = ur.user_id 
    JOIN roles r ON ur.role_id = r.id 
    WHERE r.name = 'Admin' 
    LIMIT 1;
    
    IF admin_user_id IS NULL THEN
      -- Create development admin user
      INSERT INTO users (id, name, email, role, is_active, email_verified, created_at, updated_at)
      VALUES (gen_random_uuid(), 'Development Admin', 'dev-admin@localhost.dev', 'Admin', true, true, NOW(), NOW())
      RETURNING id INTO admin_user_id;
      
      -- Get admin role
      SELECT id INTO admin_role_id FROM roles WHERE name = 'Admin';
      
      -- Assign admin role
      IF admin_role_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id) VALUES (admin_user_id, admin_role_id);
      END IF;
      
      -- Log the creation
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
      VALUES (admin_user_id, 'user_created', 'user', admin_user_id::text, '{"type": "development_admin_setup", "environment": "development"}');
      
      RAISE NOTICE 'Development admin user created: dev-admin@localhost.dev';
      RAISE NOTICE 'WARNING: This is for development only. Remove this section for production!';
    END IF;
  END IF;
END
$$;
*/

-- 15. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Migration completed successfully
SELECT 'Authentication schema migration completed successfully' AS status;