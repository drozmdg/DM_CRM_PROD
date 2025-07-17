-- PostgreSQL initialization script for Sales Dashboard development
-- This script sets up the basic database structure for development

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostgreSQL crypto functions for authentication
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a basic health check function
CREATE OR REPLACE FUNCTION health_check()
RETURNS TEXT AS $$
BEGIN
    RETURN 'Database is healthy at ' || NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE sales_dashboard_dev TO postgres;

-- Log initialization completion
DO $$
BEGIN
    RAISE NOTICE 'Sales Dashboard database initialized successfully at %', NOW();
END $$;