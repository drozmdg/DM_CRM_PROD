#!/usr/bin/env node

/**
 * Database Migration Verification Script
 * Verifies data integrity after migration from Supabase to PostgreSQL
 */

import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

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

console.log('🔍 Database Migration Verification');
console.log(`📍 Connecting to: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

const pool = new Pool(dbConfig);

/**
 * Test database connectivity
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
 * Verify table structure and existence
 */
async function verifyTableStructure() {
  console.log('\n🏗️  Verifying table structure...');
  
  const expectedTables = [
    'users', 'customers', 'contacts', 'contact_customer_assignments',
    'teams', 'services', 'processes', 'documents', 'timeline_events',
    'ai_chat_sessions', 'ai_chat_messages', 'communications',
    'process_tasks', 'process_milestones', 'process_team',
    'process_file_transfers', 'process_notifications',
    'customer_notes', 'customer_important_dates', 'pharmaceutical_products',
    'roles', 'user_roles', 'user_sessions', 'audit_logs', 'sessions'
  ];

  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    const existingTables = result.rows.map(row => row.table_name);
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    const extraTables = existingTables.filter(table => !expectedTables.includes(table));

    console.log(`   📊 Expected tables: ${expectedTables.length}`);
    console.log(`   📋 Existing tables: ${existingTables.length}`);
    
    if (missingTables.length === 0) {
      console.log('   ✅ All expected tables exist');
    } else {
      console.log(`   ⚠️  Missing tables: ${missingTables.join(', ')}`);
    }

    if (extraTables.length > 0) {
      console.log(`   ℹ️  Additional tables: ${extraTables.join(', ')}`);
    }

    return { existingTables, missingTables, extraTables };
  } catch (error) {
    console.error('❌ Table structure verification failed:', error.message);
    return null;
  }
}

/**
 * Check data integrity and constraints
 */
async function verifyDataIntegrity() {
  console.log('\n🔍 Verifying data integrity...');

  const tests = [
    {
      name: 'Foreign Key Constraints',
      query: `
        SELECT conname, conrelid::regclass as table_name
        FROM pg_constraint 
        WHERE contype = 'f'
        ORDER BY conname
      `
    },
    {
      name: 'Check Constraints',
      query: `
        SELECT conname, conrelid::regclass as table_name
        FROM pg_constraint 
        WHERE contype = 'c'
        ORDER BY conname
      `
    },
    {
      name: 'Unique Constraints',
      query: `
        SELECT conname, conrelid::regclass as table_name
        FROM pg_constraint 
        WHERE contype = 'u'
        ORDER BY conname
      `
    },
    {
      name: 'Primary Key Constraints',
      query: `
        SELECT conname, conrelid::regclass as table_name
        FROM pg_constraint 
        WHERE contype = 'p'
        ORDER BY conname
      `
    }
  ];

  for (const test of tests) {
    try {
      const result = await pool.query(test.query);
      console.log(`   ✅ ${test.name}: ${result.rows.length} constraints found`);
    } catch (error) {
      console.log(`   ❌ ${test.name}: ${error.message}`);
    }
  }
}

/**
 * Verify indexes for performance
 */
async function verifyIndexes() {
  console.log('\n📈 Verifying performance indexes...');

  try {
    const result = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);

    const indexesByTable = result.rows.reduce((acc, row) => {
      if (!acc[row.tablename]) acc[row.tablename] = [];
      acc[row.tablename].push(row.indexname);
      return acc;
    }, {});

    console.log(`   📊 Total indexes: ${result.rows.length}`);
    
    for (const [table, indexes] of Object.entries(indexesByTable)) {
      console.log(`   📋 ${table}: ${indexes.length} indexes`);
    }

    return indexesByTable;
  } catch (error) {
    console.error('❌ Index verification failed:', error.message);
    return null;
  }
}

/**
 * Check table row counts
 */
async function verifyRowCounts() {
  console.log('\n📊 Checking table row counts...');

  try {
    const result = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserted_rows,
        n_tup_upd as updated_rows,
        n_tup_del as deleted_rows,
        n_live_tup as current_rows
      FROM pg_stat_user_tables 
      WHERE schemaname = 'public'
      ORDER BY current_rows DESC, tablename
    `);

    let totalRows = 0;
    const tableStats = {};

    for (const row of result.rows) {
      const currentRows = parseInt(row.current_rows) || 0;
      totalRows += currentRows;
      tableStats[row.tablename] = currentRows;
      
      if (currentRows > 0) {
        console.log(`   📊 ${row.tablename}: ${currentRows} rows`);
      }
    }

    console.log(`   📈 Total rows across all tables: ${totalRows}`);
    return { totalRows, tableStats };
  } catch (error) {
    console.error('❌ Row count verification failed:', error.message);
    return null;
  }
}

/**
 * Test health check functions
 */
async function testHealthCheck() {
  console.log('\n🏥 Testing health check functions...');

  try {
    const result = await pool.query('SELECT * FROM health_check()');
    const healthData = result.rows[0];
    
    console.log('   ✅ Health check function working');
    console.log(`   📊 Status: ${healthData.status}`);
    console.log(`   🕐 Timestamp: ${healthData.timestamp}`);
    console.log(`   🗄️  Database: ${healthData.database_name}`);
    console.log(`   📋 Tables: ${healthData.tables_count}`);
    console.log(`   👥 Users: ${healthData.users_count}`);
    
    return healthData;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return null;
  }
}

/**
 * Test utility functions
 */
async function testUtilityFunctions() {
  console.log('\n🔧 Testing utility functions...');

  const tests = [
    {
      name: 'Password hashing',
      query: "SELECT hash_password('test123') as hash",
      check: (result) => result.rows[0].hash && result.rows[0].hash.length > 50
    },
    {
      name: 'Password verification',
      query: "SELECT verify_password('test123', hash_password('test123')) as valid",
      check: (result) => result.rows[0].valid === true
    }
  ];

  for (const test of tests) {
    try {
      const result = await pool.query(test.query);
      if (test.check(result)) {
        console.log(`   ✅ ${test.name}: Working correctly`);
      } else {
        console.log(`   ⚠️  ${test.name}: Unexpected result`);
      }
    } catch (error) {
      console.log(`   ❌ ${test.name}: ${error.message}`);
    }
  }
}

/**
 * Generate verification report
 */
async function generateReport(verificationResults) {
  const reportPath = path.join(process.cwd(), 'database', 'migration-verification-report.md');
  
  const report = `# Database Migration Verification Report

**Generated**: ${new Date().toISOString()}
**Database**: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}

## Summary

- **Connection**: ${verificationResults.connectionSuccess ? '✅ Success' : '❌ Failed'}
- **Table Structure**: ${verificationResults.tables ? '✅ Verified' : '❌ Failed'}
- **Data Integrity**: ${verificationResults.integrity ? '✅ Verified' : '❌ Failed'}
- **Performance Indexes**: ${verificationResults.indexes ? '✅ Verified' : '❌ Failed'}
- **Row Counts**: ${verificationResults.rowCounts ? '✅ Verified' : '❌ Failed'}
- **Health Check**: ${verificationResults.healthCheck ? '✅ Working' : '❌ Failed'}
- **Utility Functions**: ${verificationResults.utilityFunctions ? '✅ Working' : '❌ Failed'}

## Table Statistics

${verificationResults.rowCounts?.tableStats ? 
  Object.entries(verificationResults.rowCounts.tableStats)
    .filter(([table, count]) => count > 0)
    .map(([table, count]) => `- **${table}**: ${count} rows`)
    .join('\n') : 'No data available'
}

**Total Rows**: ${verificationResults.rowCounts?.totalRows || 0}

## Index Summary

${verificationResults.indexes ? 
  Object.entries(verificationResults.indexes)
    .map(([table, indexes]) => `- **${table}**: ${indexes.length} indexes`)
    .join('\n') : 'No index data available'
}

## Health Check Result

${verificationResults.healthCheck ? 
  `- **Status**: ${verificationResults.healthCheck.status}
- **Database**: ${verificationResults.healthCheck.database_name}
- **Tables**: ${verificationResults.healthCheck.tables_count}
- **Users**: ${verificationResults.healthCheck.users_count}` : 'Health check failed'
}

## Recommendations

${verificationResults.connectionSuccess ? 
  '✅ Database migration appears successful and ready for production use.' : 
  '❌ Database migration requires attention before production deployment.'
}

---
*Report generated by Migration Verification Script*
`;

  fs.writeFileSync(reportPath, report);
  console.log(`\n📋 Verification report saved: ${reportPath}`);
}

/**
 * Main verification function
 */
async function verifyMigration() {
  console.log('🚀 Starting database migration verification...\n');

  const results = {};

  // Test connection
  results.connectionSuccess = await testConnection();
  if (!results.connectionSuccess) {
    console.log('\n❌ Cannot proceed with verification due to connection failure');
    await pool.end();
    process.exit(1);
  }

  // Verify table structure
  results.tables = await verifyTableStructure();

  // Verify data integrity
  results.integrity = await verifyDataIntegrity();

  // Verify indexes
  results.indexes = await verifyIndexes();

  // Check row counts
  results.rowCounts = await verifyRowCounts();

  // Test health check
  results.healthCheck = await testHealthCheck();

  // Test utility functions
  results.utilityFunctions = await testUtilityFunctions();

  // Generate report
  await generateReport(results);

  // Summary
  console.log('\n🎉 Migration verification completed!');
  
  const successCount = Object.values(results).filter(result => result !== null && result !== false).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`📊 Verification Results: ${successCount}/${totalTests} tests passed`);
  
  if (successCount === totalTests) {
    console.log('✅ Database migration verification SUCCESSFUL - Ready for production!');
  } else {
    console.log('⚠️  Database migration verification PARTIAL - Review issues before production');
  }

  await pool.end();
}

// Run verification
verifyMigration().catch(error => {
  console.error('💥 Verification failed:', error);
  process.exit(1);
});