#!/usr/bin/env node

/**
 * Supabase Data Export Script
 * Exports data from Supabase for migration to containerized PostgreSQL
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define tables to export (in dependency order)
const TABLES_TO_EXPORT = [
  'users',
  'roles', 
  'user_roles',
  'customers',
  'contacts',
  'contact_customer_assignments',
  'teams',
  'pharmaceutical_products',
  'services',
  'processes',
  'process_tasks',
  'process_milestones',
  'process_team',
  'process_file_transfers',
  'process_notifications',
  'documents',
  'timeline_events',
  'customer_notes',
  'customer_important_dates',
  'ai_chat_sessions',
  'ai_chat_messages',
  'communications',
  'user_sessions',
  'audit_logs'
];

/**
 * Export data from a single table
 */
async function exportTable(tableName) {
  try {
    console.log(`📄 Exporting table: ${tableName}...`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: true, nullsFirst: false });

    if (error) {
      console.warn(`⚠️  Warning: Could not export ${tableName}: ${error.message}`);
      return { tableName, data: [], rowCount: 0, error: error.message };
    }

    const rowCount = data?.length || 0;
    console.log(`✅ Exported ${rowCount} rows from ${tableName}`);
    
    return { tableName, data: data || [], rowCount, error: null };
  } catch (err) {
    console.warn(`⚠️  Warning: Exception exporting ${tableName}: ${err.message}`);
    return { tableName, data: [], rowCount: 0, error: err.message };
  }
}

/**
 * Generate SQL INSERT statements for a table
 */
function generateInsertSQL(tableName, data) {
  if (!data || data.length === 0) {
    return `-- No data to insert for table: ${tableName}\n`;
  }

  const columns = Object.keys(data[0]);
  let sql = `-- Data for table: ${tableName}\n`;
  sql += `DELETE FROM ${tableName}; -- Clear existing data\n`;
  
  // Generate INSERT statements in batches
  const batchSize = 100;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    sql += `INSERT INTO ${tableName} (${columns.map(col => `"${col}"`).join(', ')}) VALUES\n`;
    
    const values = batch.map(row => {
      const rowValues = columns.map(col => {
        const value = row[col];
        if (value === null || value === undefined) {
          return 'NULL';
        } else if (typeof value === 'string') {
          return `'${value.replace(/'/g, "''")}'`; // Escape single quotes
        } else if (typeof value === 'object') {
          return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
        } else if (typeof value === 'boolean') {
          return value ? 'true' : 'false';
        } else {
          return value.toString();
        }
      });
      return `(${rowValues.join(', ')})`;
    });
    
    sql += values.join(',\n');
    sql += ';\n\n';
  }
  
  return sql;
}

/**
 * Main export function
 */
async function exportSupabaseData() {
  console.log('🚀 Starting Supabase data export...');
  console.log(`📡 Connected to: ${supabaseUrl}`);
  
  const exportResults = [];
  const exportedData = {};
  
  // Export each table
  for (const tableName of TABLES_TO_EXPORT) {
    const result = await exportTable(tableName);
    exportResults.push(result);
    exportedData[tableName] = result.data;
  }

  // Create export directory
  const exportDir = path.join(process.cwd(), 'database', 'exports');
  fs.mkdirSync(exportDir, { recursive: true });

  // Generate summary report
  const totalRows = exportResults.reduce((sum, result) => sum + result.rowCount, 0);
  const successfulTables = exportResults.filter(result => result.error === null).length;
  const failedTables = exportResults.filter(result => result.error !== null);

  console.log('\n📊 Export Summary:');
  console.log(`✅ Successfully exported: ${successfulTables}/${TABLES_TO_EXPORT.length} tables`);
  console.log(`📝 Total rows exported: ${totalRows}`);
  
  if (failedTables.length > 0) {
    console.log(`❌ Failed tables: ${failedTables.map(t => t.tableName).join(', ')}`);
  }

  // Generate JSON export (for backup/verification)
  const jsonExportPath = path.join(exportDir, `supabase-export-${Date.now()}.json`);
  fs.writeFileSync(jsonExportPath, JSON.stringify({
    exportDate: new Date().toISOString(),
    supabaseUrl,
    tables: exportResults,
    data: exportedData
  }, null, 2));

  // Generate SQL migration file
  let sqlContent = `-- Supabase Data Migration Export\n`;
  sqlContent += `-- Generated on: ${new Date().toISOString()}\n`;
  sqlContent += `-- Source: ${supabaseUrl}\n`;
  sqlContent += `-- Total tables: ${TABLES_TO_EXPORT.length}\n`;
  sqlContent += `-- Total rows: ${totalRows}\n\n`;
  
  sqlContent += `-- Disable triggers and constraints during import\n`;
  sqlContent += `SET session_replication_role = replica;\n\n`;

  // Add data for each table
  for (const result of exportResults) {
    if (result.error === null && result.data.length > 0) {
      sqlContent += generateInsertSQL(result.tableName, result.data);
    }
  }

  sqlContent += `-- Re-enable triggers and constraints\n`;
  sqlContent += `SET session_replication_role = DEFAULT;\n\n`;
  
  sqlContent += `-- Update sequences to prevent ID conflicts\n`;
  sqlContent += `-- (Add sequence updates as needed for specific tables)\n\n`;
  
  sqlContent += `-- Migration complete\n`;
  sqlContent += `SELECT 'Data migration completed successfully' as status;\n`;

  const sqlExportPath = path.join(exportDir, '02-import-supabase-data.sql');
  fs.writeFileSync(sqlExportPath, sqlContent);

  // Generate import instructions
  const instructionsPath = path.join(exportDir, 'IMPORT_INSTRUCTIONS.md');
  const instructions = `# Supabase Data Import Instructions

## Files Generated

1. \`supabase-export-${Date.now()}.json\` - Complete JSON backup of exported data
2. \`02-import-supabase-data.sql\` - SQL script to import data into PostgreSQL

## How to Import Data

### Option 1: Using Docker Compose (Recommended)

1. Place the SQL file in the \`database/migrations/\` directory
2. Start the PostgreSQL container:
   \`\`\`bash
   docker-compose up database
   \`\`\`
3. The migration will run automatically

### Option 2: Manual Import

1. Connect to your PostgreSQL database
2. Run the schema migration first:
   \`\`\`bash
   psql -d sales_dashboard -f database/migrations/01-init-complete-schema.sql
   \`\`\`
3. Import the data:
   \`\`\`bash
   psql -d sales_dashboard -f database/exports/02-import-supabase-data.sql
   \`\`\`

## Export Summary

- **Date**: ${new Date().toISOString()}
- **Source**: ${supabaseUrl}
- **Tables Exported**: ${successfulTables}/${TABLES_TO_EXPORT.length}
- **Total Rows**: ${totalRows}
${failedTables.length > 0 ? `- **Failed Tables**: ${failedTables.map(t => t.tableName).join(', ')}` : ''}

## Verification

After import, verify the data:

\`\`\`sql
-- Check table row counts
SELECT 
  schemaname, 
  tablename, 
  n_tup_ins as row_count 
FROM pg_stat_user_tables 
ORDER BY tablename;

-- Test health check
SELECT * FROM health_check();
\`\`\`
`;

  fs.writeFileSync(instructionsPath, instructions);

  console.log(`\n📁 Export files created:`);
  console.log(`   📄 JSON backup: ${jsonExportPath}`);
  console.log(`   🗃️  SQL import: ${sqlExportPath}`);
  console.log(`   📋 Instructions: ${instructionsPath}`);
  
  console.log('\n🎉 Supabase data export completed successfully!');
}

// Run the export
exportSupabaseData().catch(error => {
  console.error('💥 Export failed:', error);
  process.exit(1);
});