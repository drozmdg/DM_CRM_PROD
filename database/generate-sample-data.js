#!/usr/bin/env node

/**
 * Sample Data Generator for Testing Database Migration
 * Creates sample data for testing the migrated PostgreSQL database
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Database configuration
const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'sales_dashboard_dev',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres_dev_password',
};

console.log('🚀 Sample Data Generator');
console.log(`📍 Target database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

const pool = new Pool(dbConfig);

/**
 * Generate sample data for testing
 */
async function generateSampleData() {
  console.log('\n📄 Generating sample data...');
  
  try {
    const client = await pool.connect();
    
    // Start transaction
    await client.query('BEGIN');
    
    // 1. Insert roles (if they don't exist)
    console.log('   👥 Creating roles...');
    await client.query(`
      INSERT INTO roles (id, name, description, permissions, created_at, updated_at) 
      SELECT gen_random_uuid(), 'Admin', 'Administrator with full access', '["*"]'::jsonb, NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Admin');
      
      INSERT INTO roles (id, name, description, permissions, created_at, updated_at)
      SELECT gen_random_uuid(), 'Manager', 'Manager with limited access', '["read:all", "write:customers", "write:processes"]'::jsonb, NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Manager');
      
      INSERT INTO roles (id, name, description, permissions, created_at, updated_at)
      SELECT gen_random_uuid(), 'Viewer', 'Read-only access', '["read:all"]'::jsonb, NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Viewer');
    `);
    
    // 2. Insert users
    console.log('   👤 Creating users...');
    await client.query(`
      INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at) 
      SELECT gen_random_uuid(), 'admin@example.com', crypt('admin123', gen_salt('bf')), 'Admin User', 'Admin', NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com');
      
      INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
      SELECT gen_random_uuid(), 'manager@example.com', crypt('manager123', gen_salt('bf')), 'Manager User', 'Manager', NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'manager@example.com');
      
      INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
      SELECT gen_random_uuid(), 'viewer@example.com', crypt('viewer123', gen_salt('bf')), 'Viewer User', 'Viewer', NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'viewer@example.com');
    `);
    
    // 3. Insert teams (skipping for now - teams require customer_id)
    console.log('   🏢 Skipping teams (require customer assignments)...');
    
    // 4. Insert customers
    console.log('   🏢 Creating customers...');
    await client.query(`
      INSERT INTO customers (id, name, phase, contract_start_date, contract_end_date, avatar_color, active, created_at, updated_at) 
      SELECT gen_random_uuid(), 'Acme Corporation', 'Development', '2024-01-01', '2024-12-31', '#3B82F6', true, NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'Acme Corporation');
      
      INSERT INTO customers (id, name, phase, contract_start_date, contract_end_date, avatar_color, active, created_at, updated_at)
      SELECT gen_random_uuid(), 'Global Industries', 'Testing', '2024-02-01', '2024-12-31', '#10B981', true, NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'Global Industries');
      
      INSERT INTO customers (id, name, phase, contract_start_date, contract_end_date, avatar_color, active, created_at, updated_at)
      SELECT gen_random_uuid(), 'Tech Innovations', 'Requirements', '2024-03-01', '2024-12-31', '#F59E0B', true, NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'Tech Innovations');
    `);
    
    // 5. Insert contacts
    console.log('   👥 Creating contacts...');
    await client.query(`
      INSERT INTO contacts (id, customer_id, name, title, email, phone, role, type, created_at) VALUES
      (gen_random_uuid(), (SELECT id FROM customers WHERE name = 'Acme Corporation' LIMIT 1), 'John Smith', 'CTO', 'john@acme.com', '+1-555-0201', 'CTO', 'customer', NOW()),
      (gen_random_uuid(), (SELECT id FROM customers WHERE name = 'Global Industries' LIMIT 1), 'Jane Doe', 'Project Manager', 'jane@global.com', '+1-555-0202', 'Project Manager', 'customer', NOW()),
      (gen_random_uuid(), (SELECT id FROM customers WHERE name = 'Tech Innovations' LIMIT 1), 'Bob Johnson', 'CEO', 'bob@techinnovations.com', '+1-555-0203', 'CEO', 'customer', NOW()),
      (gen_random_uuid(), NULL, 'Alice Brown', 'Account Manager', 'alice@company.com', '+1-555-0301', 'Account Manager', 'internal', NOW())
    `);
    
    // 6. Insert services
    console.log('   🔧 Creating services...');
    await client.query(`
      INSERT INTO services (id, customer_id, name, monthly_hours, created_at) VALUES
      (gen_random_uuid(), (SELECT id FROM customers WHERE name = 'Acme Corporation' LIMIT 1), 'Software Development', 160, NOW()),
      (gen_random_uuid(), (SELECT id FROM customers WHERE name = 'Global Industries' LIMIT 1), 'System Integration', 80, NOW()),
      (gen_random_uuid(), (SELECT id FROM customers WHERE name = 'Tech Innovations' LIMIT 1), 'Technical Support', 40, NOW())
    `);
    
    // 7. Insert processes
    console.log('   ⚙️ Creating processes...');
    await client.query(`
      INSERT INTO processes (id, name, description, customer_id, status, sdlc_stage, start_date, approval_status, progress, created_at, updated_at) VALUES
      (gen_random_uuid(), 'E-commerce Platform Development', 'Building a new e-commerce platform', 
        (SELECT id FROM customers WHERE name = 'Acme Corporation' LIMIT 1), 
        'active', 'development', '2024-01-01', 'approved', 45, NOW(), NOW()),
      (gen_random_uuid(), 'ERP System Integration', 'Integrating existing ERP system', 
        (SELECT id FROM customers WHERE name = 'Global Industries' LIMIT 1), 
        'active', 'testing', '2024-02-01', 'approved', 75, NOW(), NOW()),
      (gen_random_uuid(), 'Mobile App Development', 'Creating mobile companion app', 
        (SELECT id FROM customers WHERE name = 'Tech Innovations' LIMIT 1), 
        'active', 'requirements', '2024-03-01', 'approved', 20, NOW(), NOW())
    `);
    
    // 8. Insert documents
    console.log('   📄 Creating documents...');
    await client.query(`
      INSERT INTO documents (id, customer_id, name, description, category, file_url, file_size, mime_type, uploaded_at) VALUES
      (gen_random_uuid(), (SELECT id FROM customers WHERE name = 'Acme Corporation' LIMIT 1), 'Project Requirements.pdf', 'Project requirements document', 'requirements', '/documents/project-requirements.pdf', 2048576, 'application/pdf', NOW()),
      (gen_random_uuid(), (SELECT id FROM customers WHERE name = 'Global Industries' LIMIT 1), 'Technical Specification.docx', 'Technical specification document', 'technical', '/documents/technical-spec.docx', 1024768, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', NOW()),
      (gen_random_uuid(), (SELECT id FROM customers WHERE name = 'Tech Innovations' LIMIT 1), 'User Manual.pdf', 'User manual documentation', 'documentation', '/documents/user-manual.pdf', 3072000, 'application/pdf', NOW())
    `);
    
    // 9. Insert timeline events
    console.log('   📅 Creating timeline events...');
    await client.query(`
      INSERT INTO timeline_events (id, customer_id, event_type, title, description, metadata, created_at) VALUES
      (gen_random_uuid(), (SELECT id FROM customers WHERE name = 'Acme Corporation' LIMIT 1), 'milestone', 'Project Kickoff', 'Project officially started', '{"date": "2024-01-15"}'::jsonb, NOW()),
      (gen_random_uuid(), (SELECT id FROM customers WHERE name = 'Acme Corporation' LIMIT 1), 'meeting', 'Requirements Review', 'Reviewed project requirements with client', '{"date": "2024-01-20"}'::jsonb, NOW()),
      (gen_random_uuid(), (SELECT id FROM customers WHERE name = 'Global Industries' LIMIT 1), 'milestone', 'Phase 1 Complete', 'First development phase completed', '{"date": "2024-02-15"}'::jsonb, NOW())
    `);
    
    // 10. Insert AI chat sessions
    console.log('   🤖 Creating AI chat sessions...');
    await client.query(`
      INSERT INTO ai_chat_sessions (id, user_id, title, model, system_prompt, created_at) VALUES
      (gen_random_uuid(), (SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1), 'Customer Analysis Discussion', 'gpt-4', 'You are a helpful assistant analyzing customer data.', NOW()),
      (gen_random_uuid(), (SELECT id FROM users WHERE email = 'manager@example.com' LIMIT 1), 'Process Optimization Ideas', 'gpt-4', 'You are a helpful assistant optimizing business processes.', NOW())
    `);
    
    // Commit transaction
    await client.query('COMMIT');
    client.release();
    
    console.log('✅ Sample data generation completed successfully!');
    
    // Get row counts
    const countResult = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        n_live_tup as row_count
      FROM pg_stat_user_tables 
      WHERE schemaname = 'public' AND n_live_tup > 0
      ORDER BY row_count DESC, tablename
    `);
    
    console.log('\n📊 Generated data summary:');
    let totalRows = 0;
    for (const row of countResult.rows) {
      console.log(`   📋 ${row.tablename}: ${row.row_count} rows`);
      totalRows += parseInt(row.row_count);
    }
    console.log(`   📈 Total rows: ${totalRows}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error generating sample data:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

// Run data generation
generateSampleData().catch(error => {
  console.error('💥 Data generation failed:', error);
  process.exit(1);
});