#!/usr/bin/env node

/**
 * Database Migration Executor
 * Executes database schema migration for containerized PostgreSQL
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Database configuration for containerized environment
const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'sales_dashboard_dev',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres_dev_password',
};

console.log('🚀 Database Migration Executor');
console.log(`📍 Target database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

const pool = new Pool(dbConfig);

/**
 * Execute SQL file
 */
async function executeSqlFile(filePath) {
  try {
    console.log(`📄 Executing SQL file: ${filePath}`);
    
    const sql = fs.readFileSync(filePath, 'utf8');
    const client = await pool.connect();
    
    try {
      await client.query(sql);
      console.log(`✅ Successfully executed: ${path.basename(filePath)}`);
      return true;
    } catch (error) {
      console.error(`❌ Error executing ${path.basename(filePath)}:`, error.message);
      return false;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`❌ Error reading file ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Check if tables exist
 */
async function checkTablesExist() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    return result.rows.map(row => row.table_name);
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
    return [];
  }
}

/**
 * Test database connection
 */
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as timestamp, current_database() as database');
    client.release();
    
    console.log('✅ Database connection successful');
    console.log(`   📅 Timestamp: ${result.rows[0].timestamp}`);
    console.log(`   🗄️  Database: ${result.rows[0].database}`);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

/**
 * Main migration function
 */
async function executeDbMigration() {
  console.log('\n🔄 Starting database migration...');
  
  // Test connection
  const connected = await testConnection();
  if (!connected) {
    console.log('❌ Cannot proceed with migration due to connection failure');
    await pool.end();
    process.exit(1);
  }
  
  // Check existing tables
  const existingTables = await checkTablesExist();
  console.log(`\n📊 Found ${existingTables.length} existing tables`);
  
  if (existingTables.length > 0) {
    console.log('   📋 Existing tables:', existingTables.join(', '));
  }
  
  // Execute schema migration
  const schemaPath = path.join(process.cwd(), 'database', 'migrations', '01-init-complete-schema.sql');
  
  if (!fs.existsSync(schemaPath)) {
    console.error(`❌ Schema file not found: ${schemaPath}`);
    await pool.end();
    process.exit(1);
  }
  
  const schemaSuccess = await executeSqlFile(schemaPath);
  
  if (!schemaSuccess) {
    console.error('❌ Schema migration failed');
    await pool.end();
    process.exit(1);
  }
  
  // Verify migration
  const tablesAfterMigration = await checkTablesExist();
  console.log(`\n✅ Migration completed. Found ${tablesAfterMigration.length} tables after migration:`);
  
  if (tablesAfterMigration.length > 0) {
    tablesAfterMigration.forEach(table => {
      console.log(`   📋 ${table}`);
    });
  }
  
  // Check if we have expected tables
  const expectedTables = [
    'users', 'customers', 'contacts', 'services', 'processes', 
    'documents', 'timeline_events', 'ai_chat_sessions', 'roles'
  ];
  
  const missingTables = expectedTables.filter(table => !tablesAfterMigration.includes(table));
  
  if (missingTables.length === 0) {
    console.log('\n🎉 Database schema migration SUCCESSFUL!');
    console.log('✅ All expected tables created');
  } else {
    console.log(`\n⚠️  Database schema migration PARTIAL`);
    console.log(`   ❌ Missing tables: ${missingTables.join(', ')}`);
  }
  
  await pool.end();
  return tablesAfterMigration.length > 0;
}

// Execute migration
executeDbMigration().catch(error => {
  console.error('💥 Migration failed:', error);
  process.exit(1);
});