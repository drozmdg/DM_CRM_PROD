-- Supabase Authentication Migration for DM_CRM
-- This migration works with Supabase's built-in auth system
-- Execute this via Supabase Dashboard > SQL Editor

-- Create user_profiles table to extend auth.users
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'Viewer' CHECK (role IN ('Admin', 'Manager', 'Viewer')),
    avatar VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create roles table for RBAC
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user_roles junction table (using auth.users UUID)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- Create user_sessions table for session management
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
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
INSERT INTO public.roles (name, description, permissions) VALUES 
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

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for roles
CREATE POLICY "Authenticated users can view roles" ON public.roles
    FOR SELECT TO authenticated USING (true);

-- Create RLS policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Create RLS policies for user_sessions
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own sessions" ON public.user_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for audit_logs
CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON public.user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to user_profiles table
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to roles table
DROP TRIGGER IF EXISTS update_roles_updated_at ON public.roles;
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (id, name, role)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 'Viewer');
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to get user with profile
CREATE OR REPLACE FUNCTION public.get_user_with_profile(user_id UUID)
RETURNS TABLE (
    id UUID,
    email VARCHAR,
    name VARCHAR,
    role VARCHAR,
    avatar VARCHAR,
    is_active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email::VARCHAR,
        p.name,
        p.role,
        p.avatar,
        p.is_active,
        p.created_at,
        p.updated_at
    FROM auth.users u
    JOIN public.user_profiles p ON u.id = p.id
    WHERE u.id = user_id;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION public.check_user_permission(
    user_id UUID,
    resource TEXT,
    action TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR;
    role_permissions JSONB;
BEGIN
    -- Get user role
    SELECT p.role INTO user_role
    FROM public.user_profiles p
    WHERE p.id = user_id;
    
    -- Get role permissions
    SELECT r.permissions INTO role_permissions
    FROM public.roles r
    WHERE r.name = user_role;
    
    -- Check permission
    RETURN COALESCE(
        (role_permissions->resource->action)::boolean,
        false
    );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create view for easy user access
CREATE OR REPLACE VIEW public.users_with_profiles AS
SELECT 
    u.id,
    u.email,
    p.name,
    p.role,
    p.avatar,
    p.is_active,
    u.created_at AS auth_created_at,
    p.created_at AS profile_created_at,
    p.updated_at
FROM auth.users u
JOIN public.user_profiles p ON u.id = p.id;

-- Grant necessary permissions
GRANT SELECT ON public.users_with_profiles TO authenticated;
GRANT SELECT ON public.roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_sessions TO authenticated;
GRANT INSERT ON public.audit_logs TO authenticated;

-- Success message
SELECT 'Authentication schema migration completed successfully!' AS status;