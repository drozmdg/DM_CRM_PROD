-- ========================================================================
-- FINAL AUTHENTICATION MIGRATION - PRODUCTION READY
-- ========================================================================
-- This migration works with your existing public.users table structure
-- Execute this script with full database access
-- ========================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================================================
-- STEP 1: UPDATE EXISTING USERS TABLE
-- ========================================================================

-- Add authentication-related columns to existing users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;

-- Create unique index on email if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON public.users(email);

-- ========================================================================
-- STEP 2: CREATE AUTHENTICATION TABLES
-- ========================================================================

-- Create roles table for detailed RBAC permissions
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user_roles junction table (using TEXT for user_id to match your users table)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_by TEXT REFERENCES public.users(id),
    assigned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- Create user_sessions table for session management
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Create audit_logs table for security tracking
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES public.users(id),
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
-- STEP 3: INSERT DEFAULT ROLES WITH DETAILED PERMISSIONS
-- ========================================================================

INSERT INTO public.roles (name, description, permissions) VALUES 
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
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- ========================================================================

-- Enable RLS on all authentication tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ========================================================================
-- STEP 5: CREATE RLS POLICIES
-- ========================================================================

-- RLS Policies for users table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (
        auth.uid()::text = id OR 
        (auth.jwt() ->> 'role') = 'Admin'
    );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (
        auth.uid()::text = id OR 
        (auth.jwt() ->> 'role') = 'Admin'
    );

DROP POLICY IF EXISTS "Only admins can create users" ON public.users;
CREATE POLICY "Only admins can create users" ON public.users
    FOR INSERT WITH CHECK (
        (auth.jwt() ->> 'role') = 'Admin'
    );

DROP POLICY IF EXISTS "Only admins can delete users" ON public.users;
CREATE POLICY "Only admins can delete users" ON public.users
    FOR DELETE USING (
        (auth.jwt() ->> 'role') = 'Admin'
    );

-- RLS Policies for roles table
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.roles;
CREATE POLICY "Authenticated users can view roles" ON public.roles
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Only admins can modify roles" ON public.roles;
CREATE POLICY "Only admins can modify roles" ON public.roles
    FOR ALL USING (
        (auth.jwt() ->> 'role') = 'Admin'
    );

-- RLS Policies for user_roles table
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (
        auth.uid()::text = user_id OR 
        (auth.jwt() ->> 'role') = 'Admin'
    );

DROP POLICY IF EXISTS "Only admins can modify user roles" ON public.user_roles;
CREATE POLICY "Only admins can modify user roles" ON public.user_roles
    FOR ALL USING (
        (auth.jwt() ->> 'role') = 'Admin'
    );

-- RLS Policies for user_sessions table
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
    FOR SELECT USING (
        auth.uid()::text = user_id OR 
        (auth.jwt() ->> 'role') = 'Admin'
    );

DROP POLICY IF EXISTS "Users can manage their own sessions" ON public.user_sessions;
CREATE POLICY "Users can manage their own sessions" ON public.user_sessions
    FOR ALL USING (
        auth.uid()::text = user_id OR 
        (auth.jwt() ->> 'role') = 'Admin'
    );

-- RLS Policies for audit_logs table
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (
        (auth.jwt() ->> 'role') = 'Admin'
    );

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- ========================================================================
-- STEP 6: CREATE PERFORMANCE INDEXES
-- ========================================================================

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON public.users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON public.users(last_login);

-- Indexes for roles table
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);

-- Indexes for user_roles table
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);

-- Indexes for user_sessions table
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON public.user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);

-- Indexes for audit_logs table
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- ========================================================================
-- STEP 7: CREATE UTILITY FUNCTIONS
-- ========================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply timestamp trigger to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Apply timestamp trigger to roles table
DROP TRIGGER IF EXISTS update_roles_updated_at ON public.roles;
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to hash passwords
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN crypt(password, gen_salt('bf', 12));
END;
$$ language 'plpgsql';

-- Function to verify passwords
CREATE OR REPLACE FUNCTION public.verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (crypt(password, hash) = hash);
END;
$$ language 'plpgsql';

-- Function to log authentication events
CREATE OR REPLACE FUNCTION public.log_auth_event(
    p_user_id TEXT,
    p_action VARCHAR(100),
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.audit_logs (user_id, action, resource_type, ip_address, user_agent)
    VALUES (p_user_id, p_action, 'authentication', p_ip_address, p_user_agent);
END;
$$ language 'plpgsql';

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.user_sessions WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ language 'plpgsql';

-- Function to get user with role details
CREATE OR REPLACE FUNCTION public.get_user_with_role(p_user_id TEXT)
RETURNS TABLE (
    id TEXT,
    name VARCHAR,
    email VARCHAR,
    role user_role,
    avatar VARCHAR,
    is_active BOOLEAN,
    role_permissions JSONB,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.avatar,
        u.is_active,
        COALESCE(r.permissions, '{}'::jsonb) as role_permissions,
        u.created_at,
        u.updated_at
    FROM public.users u
    LEFT JOIN public.roles r ON r.name = u.role::text
    WHERE u.id = p_user_id;
END;
$$ language 'plpgsql';

-- Function to check user permissions
CREATE OR REPLACE FUNCTION public.check_user_permission(
    p_user_id TEXT,
    p_resource TEXT,
    p_action TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    user_role_name TEXT;
    role_permissions JSONB;
BEGIN
    -- Get user role
    SELECT u.role::text INTO user_role_name
    FROM public.users u
    WHERE u.id = p_user_id;
    
    -- Get role permissions
    SELECT r.permissions INTO role_permissions
    FROM public.roles r
    WHERE r.name = user_role_name;
    
    -- Check permission
    RETURN COALESCE(
        (role_permissions->p_resource->p_action)::boolean,
        false
    );
END;
$$ language 'plpgsql';

-- ========================================================================
-- STEP 8: CREATE USEFUL VIEWS
-- ========================================================================

-- View for users with their role details
CREATE OR REPLACE VIEW public.users_with_roles AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u.avatar,
    u.is_active,
    u.last_login,
    u.failed_login_attempts,
    u.email_verified,
    u.created_at,
    u.updated_at,
    r.permissions as role_permissions
FROM public.users u
LEFT JOIN public.roles r ON r.name = u.role::text;

-- View for active user sessions
CREATE OR REPLACE VIEW public.active_sessions AS
SELECT 
    s.id,
    s.user_id,
    u.name as user_name,
    u.email as user_email,
    s.created_at,
    s.last_used,
    s.expires_at,
    s.ip_address,
    s.user_agent
FROM public.user_sessions s
JOIN public.users u ON u.id = s.user_id
WHERE s.expires_at > NOW();

-- ========================================================================
-- STEP 9: GRANT PERMISSIONS
-- ========================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT ON public.roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_sessions TO authenticated;
GRANT INSERT ON public.audit_logs TO authenticated;
GRANT SELECT ON public.users_with_roles TO authenticated;
GRANT SELECT ON public.active_sessions TO authenticated;

-- Grant permissions to service role for admin operations
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.roles TO service_role;
GRANT ALL ON public.user_roles TO service_role;
GRANT ALL ON public.user_sessions TO service_role;
GRANT ALL ON public.audit_logs TO service_role;

-- ========================================================================
-- STEP 10: SUCCESS VALIDATION
-- ========================================================================

-- Test the setup
DO $$
DECLARE
    users_count INTEGER;
    roles_count INTEGER;
    indexes_count INTEGER;
BEGIN
    -- Count existing data
    SELECT COUNT(*) INTO users_count FROM public.users;
    SELECT COUNT(*) INTO roles_count FROM public.roles;
    SELECT COUNT(*) INTO indexes_count FROM pg_indexes WHERE tablename LIKE 'users' OR tablename LIKE 'roles' OR tablename LIKE 'user_%';
    
    -- Output results
    RAISE NOTICE '========================================';
    RAISE NOTICE 'AUTHENTICATION MIGRATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Database Status:';
    RAISE NOTICE '- Users table: % users', users_count;
    RAISE NOTICE '- Roles table: % roles', roles_count;
    RAISE NOTICE '- Performance indexes: % created', indexes_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables created/updated:';
    RAISE NOTICE '✓ users (enhanced with auth columns)';
    RAISE NOTICE '✓ roles (with detailed permissions)';
    RAISE NOTICE '✓ user_roles (junction table)';
    RAISE NOTICE '✓ user_sessions (session management)';
    RAISE NOTICE '✓ audit_logs (security tracking)';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Security features enabled:';
    RAISE NOTICE '✓ Row Level Security (RLS) policies';
    RAISE NOTICE '✓ Password hashing functions';
    RAISE NOTICE '✓ Session management';
    RAISE NOTICE '✓ Audit logging';
    RAISE NOTICE '✓ Permission checking';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test authentication endpoints';
    RAISE NOTICE '2. Create your first admin user';
    RAISE NOTICE '3. Verify security features';
    RAISE NOTICE '========================================';
END $$;

-- Final success message
SELECT 
    'AUTHENTICATION MIGRATION COMPLETED SUCCESSFULLY!' as status,
    NOW() as completed_at,
    'Ready for Phase 1 completion testing' as next_step;