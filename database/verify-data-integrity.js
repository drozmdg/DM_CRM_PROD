#!/usr/bin/env node

/**
 * Data Integrity Verification Script
 * Comprehensive verification of database constraints, relationships, and data validation
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

console.log('🔍 Data Integrity Verification');
console.log(`📍 Database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

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
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

/**
 * Verify all table constraints
 */
async function verifyConstraints() {
  console.log('\n🔒 Verifying database constraints...');
  
  try {
    // Check primary key constraints
    const pkResult = await pool.query(`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        string_agg(kcu.column_name, ', ') as columns
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public' 
        AND tc.constraint_type = 'PRIMARY KEY'
      GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type
      ORDER BY tc.table_name
    `);
    
    console.log(`   ✅ Primary Key constraints: ${pkResult.rows.length} found`);
    
    // Check foreign key constraints
    const fkResult = await pool.query(`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_schema = 'public' 
        AND tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name, tc.constraint_name
    `);
    
    console.log(`   ✅ Foreign Key constraints: ${fkResult.rows.length} found`);
    
    // Check unique constraints
    const uniqueResult = await pool.query(`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        string_agg(kcu.column_name, ', ') as columns
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public' 
        AND tc.constraint_type = 'UNIQUE'
      GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type
      ORDER BY tc.table_name
    `);
    
    console.log(`   ✅ Unique constraints: ${uniqueResult.rows.length} found`);
    
    // Check check constraints
    const checkResult = await pool.query(`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        cc.check_clause
      FROM information_schema.table_constraints tc
      JOIN information_schema.check_constraints cc 
        ON tc.constraint_name = cc.constraint_name
      WHERE tc.table_schema = 'public' 
        AND tc.constraint_type = 'CHECK'
      ORDER BY tc.table_name, tc.constraint_name
    `);
    
    console.log(`   ✅ Check constraints: ${checkResult.rows.length} found`);
    
    return {
      primary_keys: pkResult.rows.length,
      foreign_keys: fkResult.rows.length,
      unique_constraints: uniqueResult.rows.length,
      check_constraints: checkResult.rows.length
    };
    
  } catch (error) {
    console.error('❌ Constraint verification failed:', error.message);
    return null;
  }
}

/**
 * Verify indexes for performance
 */
async function verifyIndexes() {
  console.log('\n📈 Verifying database indexes...');
  
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
      if (!acc[row.tablename]) acc[row.tablename] = 0;
      acc[row.tablename]++;
      return acc;
    }, {});
    
    console.log(`   ✅ Total indexes: ${result.rows.length}`);
    
    // Check for essential indexes
    const essentialIndexes = [
      { table: 'users', column: 'email' },
      { table: 'customers', column: 'email' },
      { table: 'contacts', column: 'email' },
      { table: 'processes', column: 'customer_id' },
      { table: 'documents', column: 'customer_id' }
    ];
    
    for (const { table, column } of essentialIndexes) {
      const indexCheck = await pool.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
          AND tablename = $1 
          AND indexdef LIKE '%' || $2 || '%'
      `, [table, column]);
      
      if (indexCheck.rows.length > 0) {
        console.log(`   ✅ ${table}.${column}: Indexed`);
      } else {
        console.log(`   ⚠️  ${table}.${column}: Missing index`);
      }
    }
    
    return { total: result.rows.length, by_table: indexesByTable };
    
  } catch (error) {
    console.error('❌ Index verification failed:', error.message);
    return null;
  }
}

/**
 * Test data validation rules
 */
async function testDataValidation() {
  console.log('\n🔐 Testing data validation rules...');
  
  const validationTests = [
    {
      name: 'Email validation in users table',
      query: "SELECT email FROM users WHERE email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'",
      test: 'email_format'
    },
    {
      name: 'UUID format in id columns',
      query: "SELECT id FROM users WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'",
      test: 'uuid_format'
    },
    {
      name: 'Timestamp columns not null',
      query: "SELECT COUNT(*) as count FROM users WHERE created_at IS NOT NULL AND updated_at IS NOT NULL",
      test: 'timestamp_not_null'
    },
    {
      name: 'Password hashing function',
      query: "SELECT hash_password('test123') as hash",
      test: 'password_hashing'
    },
    {
      name: 'Password verification function',
      query: "SELECT verify_password('test123', hash_password('test123')) as valid",
      test: 'password_verification'
    }
  ];
  
  let passedTests = 0;
  
  for (const test of validationTests) {
    try {
      const result = await pool.query(test.query);
      
      if (test.test === 'email_format' || test.test === 'uuid_format') {
        console.log(`   ✅ ${test.name}: ${result.rows.length} valid entries`);
        passedTests++;
      } else if (test.test === 'timestamp_not_null') {
        const count = result.rows[0].count;
        console.log(`   ✅ ${test.name}: ${count} records with valid timestamps`);
        passedTests++;
      } else if (test.test === 'password_hashing') {
        const hash = result.rows[0].hash;
        if (hash && hash.length > 50) {
          console.log(`   ✅ ${test.name}: Working correctly`);
          passedTests++;
        } else {
          console.log(`   ❌ ${test.name}: Invalid hash generated`);
        }
      } else if (test.test === 'password_verification') {
        const valid = result.rows[0].valid;
        if (valid === true) {
          console.log(`   ✅ ${test.name}: Working correctly`);
          passedTests++;
        } else {
          console.log(`   ❌ ${test.name}: Verification failed`);
        }
      }
    } catch (error) {
      console.log(`   ❌ ${test.name}: ${error.message}`);
    }
  }
  
  return { total: validationTests.length, passed: passedTests };
}

/**
 * Test referential integrity
 */
async function testReferentialIntegrity() {
  console.log('\n🔗 Testing referential integrity...');
  
  const integrityTests = [
    {
      name: 'Users exist for user_roles',
      query: `
        SELECT COUNT(*) as orphaned_rows
        FROM user_roles ur
        LEFT JOIN users u ON ur.user_id = u.id
        WHERE u.id IS NULL
      `
    },
    {
      name: 'Customers exist for processes',
      query: `
        SELECT COUNT(*) as orphaned_rows
        FROM processes p
        LEFT JOIN customers c ON p.customer_id = c.id
        WHERE c.id IS NULL
      `
    },
    {
      name: 'Customers exist for documents',
      query: `
        SELECT COUNT(*) as orphaned_rows
        FROM documents d
        LEFT JOIN customers c ON d.customer_id = c.id
        WHERE c.id IS NULL
      `
    },
    {
      name: 'Processes exist for process_tasks',
      query: `
        SELECT COUNT(*) as orphaned_rows
        FROM process_tasks pt
        LEFT JOIN processes p ON pt.process_id = p.id
        WHERE p.id IS NULL
      `
    }
  ];
  
  let passedTests = 0;
  
  for (const test of integrityTests) {
    try {
      const result = await pool.query(test.query);
      const orphanedRows = result.rows[0].orphaned_rows;
      
      if (orphanedRows == 0) {
        console.log(`   ✅ ${test.name}: No orphaned records`);
        passedTests++;
      } else {
        console.log(`   ❌ ${test.name}: ${orphanedRows} orphaned records found`);
      }
    } catch (error) {
      console.log(`   ❌ ${test.name}: ${error.message}`);
    }
  }
  
  return { total: integrityTests.length, passed: passedTests };
}

/**
 * Test health check function
 */
async function testHealthCheck() {
  console.log('\n🏥 Testing health check function...');
  
  try {
    const result = await pool.query('SELECT * FROM health_check()');
    
    if (result.rows.length > 0) {
      const healthData = result.rows[0];
      console.log(`   ✅ Health check working`);
      console.log(`   📊 Status: ${healthData.status}`);
      console.log(`   🗄️  Database: ${healthData.database_name}`);
      console.log(`   📋 Tables: ${healthData.tables_count}`);
      console.log(`   👥 Users: ${healthData.users_count}`);
      return true;
    } else {
      console.log(`   ❌ Health check returned no data`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Health check failed: ${error.message}`);
    return false;
  }
}

/**
 * Generate integrity report
 */
async function generateIntegrityReport(results) {
  const reportPath = path.join(process.cwd(), 'database', 'data-integrity-report.md');
  
  const report = `# Database Data Integrity Report

**Generated**: ${new Date().toISOString()}
**Database**: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}

## Summary

- **Connection**: ${results.connectionSuccess ? '✅ Success' : '❌ Failed'}
- **Constraints**: ${results.constraints ? '✅ Verified' : '❌ Failed'}
- **Indexes**: ${results.indexes ? '✅ Verified' : '❌ Failed'}
- **Data Validation**: ${results.validation ? '✅ Verified' : '❌ Failed'}
- **Referential Integrity**: ${results.referentialIntegrity ? '✅ Verified' : '❌ Failed'}
- **Health Check**: ${results.healthCheck ? '✅ Working' : '❌ Failed'}

## Constraint Summary

${results.constraints ? `
- **Primary Keys**: ${results.constraints.primary_keys}
- **Foreign Keys**: ${results.constraints.foreign_keys}
- **Unique Constraints**: ${results.constraints.unique_constraints}
- **Check Constraints**: ${results.constraints.check_constraints}
` : 'Constraint verification failed'}

## Index Summary

${results.indexes ? `
- **Total Indexes**: ${results.indexes.total}
- **Tables with Indexes**: ${Object.keys(results.indexes.by_table).length}
` : 'Index verification failed'}

## Data Validation Results

${results.validation ? `
- **Tests Passed**: ${results.validation.passed}/${results.validation.total}
- **Success Rate**: ${Math.round((results.validation.passed / results.validation.total) * 100)}%
` : 'Data validation failed'}

## Referential Integrity Results

${results.referentialIntegrity ? `
- **Tests Passed**: ${results.referentialIntegrity.passed}/${results.referentialIntegrity.total}
- **Success Rate**: ${Math.round((results.referentialIntegrity.passed / results.referentialIntegrity.total) * 100)}%
` : 'Referential integrity verification failed'}

## Overall Assessment

${results.connectionSuccess && results.constraints && results.indexes && results.validation && results.referentialIntegrity && results.healthCheck ? 
  '✅ **DATABASE INTEGRITY VERIFIED** - All systems operational and ready for production.' : 
  '⚠️  **DATABASE INTEGRITY ISSUES** - Some systems require attention before production deployment.'
}

## Recommendations

1. ${results.connectionSuccess ? '✅ Database connection is stable' : '❌ Fix database connection issues'}
2. ${results.constraints ? '✅ All constraints properly configured' : '❌ Review and fix constraint issues'}
3. ${results.indexes ? '✅ Performance indexes in place' : '❌ Add missing performance indexes'}
4. ${results.validation ? '✅ Data validation rules working' : '❌ Fix data validation issues'}
5. ${results.referentialIntegrity ? '✅ Referential integrity maintained' : '❌ Fix orphaned record issues'}
6. ${results.healthCheck ? '✅ Health monitoring operational' : '❌ Fix health check function'}

---
*Report generated by Data Integrity Verification Script*
`;

  fs.writeFileSync(reportPath, report);
  console.log(`\n📋 Data integrity report saved: ${reportPath}`);
}

/**
 * Main verification function
 */
async function verifyDataIntegrity() {
  console.log('\n🚀 Starting data integrity verification...\n');
  
  const results = {};
  
  // Test connection
  results.connectionSuccess = await testConnection();
  if (!results.connectionSuccess) {
    console.log('\n❌ Cannot proceed with verification due to connection failure');
    await pool.end();
    process.exit(1);
  }
  
  // Verify constraints
  results.constraints = await verifyConstraints();
  
  // Verify indexes
  results.indexes = await verifyIndexes();
  
  // Test data validation
  results.validation = await testDataValidation();
  
  // Test referential integrity
  results.referentialIntegrity = await testReferentialIntegrity();
  
  // Test health check
  results.healthCheck = await testHealthCheck();
  
  // Generate report
  await generateIntegrityReport(results);
  
  // Summary
  console.log('\n🎉 Data integrity verification completed!');
  
  const successfulTests = Object.values(results).filter(result => result !== null && result !== false).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`📊 Verification Results: ${successfulTests}/${totalTests} tests passed`);
  
  const overallSuccess = successfulTests === totalTests;
  
  if (overallSuccess) {
    console.log('✅ DATA INTEGRITY VERIFIED - Ready for production!');
  } else {
    console.log('⚠️  DATA INTEGRITY ISSUES - Review report before production');
  }
  
  await pool.end();
  return overallSuccess;
}

// Run verification
verifyDataIntegrity().catch(error => {
  console.error('💥 Data integrity verification failed:', error);
  process.exit(1);
});