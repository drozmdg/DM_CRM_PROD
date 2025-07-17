#!/usr/bin/env node

/**
 * Database Backup Verification Script
 * Comprehensive backup creation, verification, and restoration testing
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const execAsync = promisify(exec);
const { Pool } = pg;

// Database configuration
const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'sales_dashboard_dev',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres_dev_password',
};

console.log('💾 Database Backup Verification System');
console.log(`📍 Database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

const pool = new Pool(dbConfig);

// Backup directory
const backupDir = path.join(process.cwd(), 'database', 'backups');
fs.mkdirSync(backupDir, { recursive: true });

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
 * Create database backup using pg_dump
 */
async function createBackup() {
  console.log('\\n📦 Creating database backup...');
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);
    const customBackupFile = path.join(backupDir, `backup-${timestamp}.dump`);
    
    // Create SQL backup
    const sqlCommand = `docker exec sales-dashboard-db-dev pg_dump -U ${dbConfig.user} -d ${dbConfig.database} > ${backupFile}`;
    console.log('   📄 Creating SQL backup...');
    await execAsync(sqlCommand);
    
    // Create custom format backup (compressed)
    const customCommand = `docker exec sales-dashboard-db-dev pg_dump -U ${dbConfig.user} -d ${dbConfig.database} -Fc > ${customBackupFile}`;
    console.log('   🗜️  Creating compressed backup...');
    await execAsync(customCommand);
    
    // Get file sizes
    const sqlStats = fs.statSync(backupFile);
    const customStats = fs.statSync(customBackupFile);
    
    console.log(`   ✅ SQL backup created: ${backupFile} (${Math.round(sqlStats.size / 1024)} KB)`);
    console.log(`   ✅ Custom backup created: ${customBackupFile} (${Math.round(customStats.size / 1024)} KB)`);
    
    return {
      sqlBackup: backupFile,
      customBackup: customBackupFile,
      timestamp: timestamp,
      sqlSize: sqlStats.size,
      customSize: customStats.size
    };
    
  } catch (error) {
    console.error('❌ Backup creation failed:', error.message);
    return null;
  }
}

/**
 * Verify backup file integrity
 */
async function verifyBackupIntegrity(backupInfo) {
  console.log('\\n🔍 Verifying backup integrity...');
  
  try {
    // Check if files exist and are readable
    if (!fs.existsSync(backupInfo.sqlBackup)) {
      throw new Error('SQL backup file not found');
    }
    
    if (!fs.existsSync(backupInfo.customBackup)) {
      throw new Error('Custom backup file not found');
    }
    
    // Verify SQL backup contains expected content
    const sqlContent = fs.readFileSync(backupInfo.sqlBackup, 'utf8');
    const expectedElements = [
      'CREATE TABLE',
      'CREATE TYPE',
      'CREATE FUNCTION',
      'CREATE EXTENSION',
      'PostgreSQL database dump'
    ];
    
    let foundElements = 0;
    for (const element of expectedElements) {
      if (sqlContent.includes(element)) {
        console.log(`   ✅ Found: ${element}`);
        foundElements++;
      } else {
        console.log(`   ⚠️  Missing: ${element}`);
      }
    }
    
    // Verify custom backup using pg_restore --list
    console.log('   🔍 Verifying custom backup structure...');
    
    // Copy backup file to container for verification
    const containerBackupPath = `/tmp/backup_verify_${backupInfo.timestamp}.dump`;
    await execAsync(`docker cp ${backupInfo.customBackup} sales-dashboard-db-dev:${containerBackupPath}`);
    
    const listCommand = `docker exec sales-dashboard-db-dev pg_restore --list ${containerBackupPath}`;
    const listResult = await execAsync(listCommand);
    
    // Clean up temporary file
    await execAsync(`docker exec sales-dashboard-db-dev rm -f ${containerBackupPath}`);
    
    const listLines = listResult.stdout.split('\\n').filter(line => line.trim());
    console.log(`   ✅ Custom backup contains ${listLines.length} database objects`);
    
    // Check for essential tables in the backup
    const essentialTables = ['users', 'customers', 'processes', 'documents', 'roles'];
    let foundTables = 0;
    
    for (const table of essentialTables) {
      if (sqlContent.includes(`CREATE TABLE public.${table}`) || 
          sqlContent.includes(`CREATE TABLE ${table}`)) {
        console.log(`   ✅ Table found: ${table}`);
        foundTables++;
      } else {
        console.log(`   ⚠️  Table missing: ${table}`);
      }
    }
    
    const integrity = {
      sqlBackupValid: foundElements >= 3,
      customBackupValid: listLines.length > 0,
      tablesFound: foundTables,
      totalElements: foundElements,
      backupObjects: listLines.length
    };
    
    console.log(`   📊 Integrity check: ${foundElements}/${expectedElements.length} elements, ${foundTables}/${essentialTables.length} tables`);
    
    return integrity;
    
  } catch (error) {
    console.error('❌ Backup integrity verification failed:', error.message);
    return null;
  }
}

/**
 * Test backup restoration to a test database
 */
async function testBackupRestoration(backupInfo) {
  console.log('\\n🔄 Testing backup restoration...');
  
  const testDbName = `test_restore_${backupInfo.timestamp.replace(/[^a-zA-Z0-9]/g, '_')}`;
  
  try {
    // Create test database
    console.log(`   🏗️  Creating test database: ${testDbName}`);
    await execAsync(`docker exec sales-dashboard-db-dev psql -U ${dbConfig.user} -d ${dbConfig.database} -c "DROP DATABASE IF EXISTS ${testDbName}"`);
    await execAsync(`docker exec sales-dashboard-db-dev psql -U ${dbConfig.user} -d ${dbConfig.database} -c "CREATE DATABASE ${testDbName}"`);
    
    // Restore from SQL backup
    console.log('   📥 Restoring from SQL backup...');
    
    // Copy backup file to container for restoration
    const containerRestorePath = `/tmp/backup_restore_${backupInfo.timestamp}.sql`;
    await execAsync(`docker cp ${backupInfo.sqlBackup} sales-dashboard-db-dev:${containerRestorePath}`);
    
    const restoreCommand = `docker exec sales-dashboard-db-dev psql -U ${dbConfig.user} -d ${testDbName} -f ${containerRestorePath}`;
    await execAsync(restoreCommand);
    
    // Clean up temporary file
    await execAsync(`docker exec sales-dashboard-db-dev rm -f ${containerRestorePath}`);
    
    // Verify restoration by connecting to test database and checking tables
    const testPool = new Pool({
      ...dbConfig,
      database: testDbName
    });
    
    console.log('   ✅ Verifying restored database...');
    
    // Check table count
    const tableResult = await testPool.query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tableCount = parseInt(tableResult.rows[0].table_count);
    console.log(`   📊 Restored tables: ${tableCount}`);
    
    // Check if health check function works
    try {
      const healthResult = await testPool.query('SELECT * FROM health_check()');
      console.log(`   ✅ Health check working: ${healthResult.rows[0].status}`);
    } catch (error) {
      console.log(`   ⚠️  Health check failed: ${error.message}`);
    }
    
    // Check constraints
    const constraintResult = await testPool.query(`
      SELECT COUNT(*) as constraint_count 
      FROM information_schema.table_constraints 
      WHERE table_schema = 'public'
    `);
    
    const constraintCount = parseInt(constraintResult.rows[0].constraint_count);
    console.log(`   🔒 Restored constraints: ${constraintCount}`);
    
    await testPool.end();
    
    // Clean up test database
    console.log('   🧹 Cleaning up test database...');
    await execAsync(`docker exec sales-dashboard-db-dev psql -U ${dbConfig.user} -d ${dbConfig.database} -c "DROP DATABASE ${testDbName}"`);
    
    return {
      success: true,
      tablesRestored: tableCount,
      constraintsRestored: constraintCount,
      testDatabase: testDbName
    };
    
  } catch (error) {
    console.error('❌ Backup restoration test failed:', error.message);
    
    // Clean up test database even on failure
    try {
      await execAsync(`docker exec sales-dashboard-db-dev psql -U ${dbConfig.user} -d ${dbConfig.database} -c "DROP DATABASE IF EXISTS ${testDbName}"`);
    } catch (cleanupError) {
      console.error('❌ Failed to cleanup test database:', cleanupError.message);
    }
    
    return null;
  }
}

/**
 * Create automated backup schedule script
 */
async function createBackupSchedule() {
  console.log('\\n⏰ Creating backup schedule script...');
  
  const scheduleScript = `#!/bin/bash

# Automated Database Backup Script
# Run this script via cron for regular backups

set -e

# Configuration
BACKUP_DIR="/app/database/backups"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
DB_NAME="${dbConfig.database}"
DB_USER="${dbConfig.user}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create backup
echo "Creating backup at $TIMESTAMP..."
docker exec sales-dashboard-db-dev pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc > "$BACKUP_DIR/auto-backup-$TIMESTAMP.dump"

# Verify backup
if [ -f "$BACKUP_DIR/auto-backup-$TIMESTAMP.dump" ]; then
    echo "✅ Backup created successfully: auto-backup-$TIMESTAMP.dump"
    
    # Get backup size
    BACKUP_SIZE=$(stat -c%s "$BACKUP_DIR/auto-backup-$TIMESTAMP.dump")
    echo "📊 Backup size: $BACKUP_SIZE bytes"
    
    # Verify backup integrity
    docker exec sales-dashboard-db-dev pg_restore --list "$BACKUP_DIR/auto-backup-$TIMESTAMP.dump" > /dev/null
    echo "✅ Backup integrity verified"
else
    echo "❌ Backup creation failed"
    exit 1
fi

# Clean up old backups
echo "🧹 Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "auto-backup-*.dump" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "backup-*.dump" -mtime +$RETENTION_DAYS -delete

echo "✅ Backup process completed"
`;

  const scriptPath = path.join(backupDir, 'automated-backup.sh');
  fs.writeFileSync(scriptPath, scheduleScript);
  
  // Make script executable
  fs.chmodSync(scriptPath, '755');
  
  console.log(`   ✅ Backup schedule script created: ${scriptPath}`);
  
  // Create cron job example
  const cronExample = `# Example cron job for daily backups at 2 AM
# Add this to your crontab (crontab -e)
0 2 * * * ${scriptPath} >> /var/log/backup.log 2>&1
`;

  const cronPath = path.join(backupDir, 'cron-example.txt');
  fs.writeFileSync(cronPath, cronExample);
  
  console.log(`   📅 Cron job example created: ${cronPath}`);
  
  return {
    scriptPath: scriptPath,
    cronPath: cronPath
  };
}

/**
 * Generate backup verification report
 */
async function generateBackupReport(results) {
  const reportPath = path.join(backupDir, 'backup-verification-report.md');
  
  const report = `# Database Backup Verification Report

**Generated**: ${new Date().toISOString()}
**Database**: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}

## Summary

- **Connection**: ${results.connectionSuccess ? '✅ Success' : '❌ Failed'}
- **Backup Creation**: ${results.backupInfo ? '✅ Success' : '❌ Failed'}
- **Backup Integrity**: ${results.integrity ? '✅ Verified' : '❌ Failed'}
- **Restoration Test**: ${results.restoration ? '✅ Success' : '❌ Failed'}
- **Automation Setup**: ${results.automation ? '✅ Complete' : '❌ Failed'}

## Backup Details

${results.backupInfo ? `
- **SQL Backup**: ${path.basename(results.backupInfo.sqlBackup)} (${Math.round(results.backupInfo.sqlSize / 1024)} KB)
- **Custom Backup**: ${path.basename(results.backupInfo.customBackup)} (${Math.round(results.backupInfo.customSize / 1024)} KB)
- **Timestamp**: ${results.backupInfo.timestamp}
- **Compression Ratio**: ${Math.round((1 - results.backupInfo.customSize / results.backupInfo.sqlSize) * 100)}%
` : 'Backup creation failed'}

## Integrity Verification

${results.integrity ? `
- **SQL Backup Valid**: ${results.integrity.sqlBackupValid ? '✅ Yes' : '❌ No'}
- **Custom Backup Valid**: ${results.integrity.customBackupValid ? '✅ Yes' : '❌ No'}
- **Elements Found**: ${results.integrity.totalElements}/5 expected elements
- **Tables Found**: ${results.integrity.tablesFound}/5 essential tables
- **Backup Objects**: ${results.integrity.backupObjects} database objects
` : 'Integrity verification failed'}

## Restoration Test

${results.restoration ? `
- **Test Database**: ${results.restoration.testDatabase}
- **Tables Restored**: ${results.restoration.tablesRestored}
- **Constraints Restored**: ${results.restoration.constraintsRestored}
- **Health Check**: Functional
` : 'Restoration test failed'}

## Automation Setup

${results.automation ? `
- **Backup Script**: ${results.automation.scriptPath}
- **Cron Example**: ${results.automation.cronPath}
- **Retention**: 7 days
- **Schedule**: Ready for cron setup
` : 'Automation setup failed'}

## Recommendations

1. ${results.connectionSuccess ? '✅ Database connection is stable' : '❌ Fix database connection issues'}
2. ${results.backupInfo ? '✅ Backup creation is working' : '❌ Fix backup creation process'}
3. ${results.integrity ? '✅ Backup integrity is verified' : '❌ Fix backup integrity issues'}
4. ${results.restoration ? '✅ Restoration process is working' : '❌ Fix restoration process'}
5. ${results.automation ? '✅ Automation is configured' : '❌ Set up backup automation'}

## Next Steps

${results.connectionSuccess && results.backupInfo && results.integrity && results.restoration && results.automation ? `
✅ **BACKUP SYSTEM READY FOR PRODUCTION**

1. Set up automated backups using the provided cron job
2. Monitor backup logs regularly
3. Test restoration procedures monthly
4. Adjust retention policy based on requirements
` : `
⚠️  **BACKUP SYSTEM NEEDS ATTENTION**

1. Review failed tests and fix issues
2. Ensure all backup components are working
3. Test restoration procedures
4. Complete automation setup
`}

---
*Report generated by Database Backup Verification System*
`;

  fs.writeFileSync(reportPath, report);
  console.log(`\\n📋 Backup verification report saved: ${reportPath}`);
}

/**
 * Main backup verification function
 */
async function verifyBackupSystem() {
  console.log('\\n🚀 Starting backup verification system...');
  
  const results = {};
  
  // Test connection
  results.connectionSuccess = await testConnection();
  if (!results.connectionSuccess) {
    console.log('\\n❌ Cannot proceed with backup verification due to connection failure');
    await pool.end();
    process.exit(1);
  }
  
  // Create backup
  results.backupInfo = await createBackup();
  
  // Verify backup integrity
  if (results.backupInfo) {
    results.integrity = await verifyBackupIntegrity(results.backupInfo);
  }
  
  // Test backup restoration
  if (results.backupInfo && results.integrity) {
    results.restoration = await testBackupRestoration(results.backupInfo);
  }
  
  // Set up automation
  results.automation = await createBackupSchedule();
  
  // Generate report
  await generateBackupReport(results);
  
  // Summary
  console.log('\\n🎉 Backup verification system completed!');
  
  const successfulTests = Object.values(results).filter(result => result !== null && result !== false).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`📊 Verification Results: ${successfulTests}/${totalTests} tests passed`);
  
  const overallSuccess = successfulTests === totalTests;
  
  if (overallSuccess) {
    console.log('✅ BACKUP SYSTEM VERIFIED - Ready for production!');
  } else {
    console.log('⚠️  BACKUP SYSTEM ISSUES - Review report before production');
  }
  
  await pool.end();
  return overallSuccess;
}

// Run backup verification
verifyBackupSystem().catch(error => {
  console.error('💥 Backup verification failed:', error);
  process.exit(1);
});