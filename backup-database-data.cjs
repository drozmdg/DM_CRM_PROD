// Database Backup Script - Option B: SQL Dump Generation & Option C: Documentation
const fs = require('fs');
const path = require('path');
const http = require('http');

// Get current data from running application API
const getCurrentData = async () => {
  console.log('📡 Fetching current data from running application...');
  
  const endpoints = [
    '/api/customers',
    '/api/contacts', 
    '/api/teams',
    '/api/services',
    '/api/processes',
    '/api/documents',
    '/api/timeline-events',
    '/api/communications'
  ];
  
  const data = {};
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetchFromAPI(endpoint);
      const tableName = endpoint.split('/').pop().replace('-', '');
      data[tableName] = response || [];
      console.log(`✅ ${tableName}: ${data[tableName].length} records`);
    } catch (error) {
      console.log(`⚠️ Could not fetch ${endpoint}: ${error.message}`);
      data[endpoint.split('/').pop().replace('-', '')] = [];
    }
  }
  
  return data;
};

// Helper function to fetch from API
const fetchFromAPI = (endpoint) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: endpoint,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    });
    
    req.on('error', (err) => reject(err));
    req.setTimeout(5000, () => reject(new Error('Request timeout')));
    req.end();
  });
};

// Generate SQL dump from current data
async function generateSQLDump(currentData) {
  if (!currentData) {
    console.log('No data available - cannot create backup');
    return;
  }

  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const filename = `sales_dashboard_backup_${timestamp}.sql`;
  
  let sqlDump = `-- Sales Dashboard Database Backup
-- Generated: ${new Date().toISOString()}
-- Database: DM_CRM Sales Dashboard
-- Tables: customers, contacts, teams, services, processes, documents, timelineevents, communications
-- Purpose: Backup before clearing test data for production deployment

-- =============================================================================
-- SCHEMA CREATION (for reference)
-- =============================================================================

-- Note: This backup contains the data structure and sample data
-- The actual schema is managed by Drizzle ORM migrations

-- =============================================================================
-- DATA BACKUP
-- =============================================================================

`;

  // Generate INSERT statements for each table
  const tables = ['customers', 'contacts', 'teams', 'services', 'processes', 'documents', 'timelineevents', 'communications'];
  
  tables.forEach(tableName => {
    const data = currentData[tableName] || [];
    if (data.length > 0) {
      sqlDump += `\n-- ========================================\n`;
      sqlDump += `-- ${tableName.toUpperCase()} TABLE DATA\n`;
      sqlDump += `-- ========================================\n\n`;
      
      // Convert camelCase to snake_case for SQL
      const sqlTableName = tableName.replace(/([A-Z])/g, '_$1').toLowerCase().replace('timelineevents', 'timeline_events');
      
      data.forEach((record, index) => {
        const columns = Object.keys(record);
        const values = Object.values(record).map(val => {
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
          if (typeof val === 'boolean') return val ? 'true' : 'false';
          if (Array.isArray(val)) return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          return val;
        });
        
        sqlDump += `INSERT INTO ${sqlTableName} (${columns.map(col => col.replace(/([A-Z])/g, '_$1').toLowerCase()).join(', ')}) VALUES (${values.join(', ')});\n`;
      });
      
      sqlDump += `\n-- Total ${tableName} records: ${data.length}\n`;
    }
  });

  // Add summary
  sqlDump += `\n-- =============================================================================\n`;
  sqlDump += `-- BACKUP SUMMARY\n`;
  sqlDump += `-- =============================================================================\n\n`;
  sqlDump += `-- Backup completed: ${new Date().toISOString()}\n`;
  sqlDump += `-- Total tables backed up: ${tables.filter(t => currentData[t] && currentData[t].length > 0).length}\n`;
  
  tables.forEach(tableName => {
    const count = currentData[tableName] ? currentData[tableName].length : 0;
    sqlDump += `-- ${tableName}: ${count} records\n`;
  });
  
  sqlDump += `\n-- To restore this data:\n`;
  sqlDump += `-- 1. Ensure database schema is up to date\n`;
  sqlDump += `-- 2. Clear existing data if needed\n`;
  sqlDump += `-- 3. Run this SQL script\n`;
  sqlDump += `\n-- END OF BACKUP\n`;

  // Write to file
  fs.writeFileSync(filename, sqlDump, 'utf8');
  console.log(`✅ SQL Database backup created: ${filename}`);
  console.log(`📊 File size: ${fs.statSync(filename).size} bytes`);
  
  return filename;
}

// Generate database documentation - Option C
async function generateDatabaseDocumentation(currentData) {
  if (!currentData) {
    console.log('No data available - cannot create documentation');
    return;
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `database_structure_documentation_${timestamp}.md`;
  
  let documentation = `# Sales Dashboard Database Structure Documentation

**Generated**: ${new Date().toISOString()}  
**Database**: DM_CRM Sales Dashboard  
**Purpose**: Current data structure backup before clearing test data  

## 📊 Database Summary

`;

  // Calculate totals
  const tables = ['customers', 'contacts', 'teams', 'services', 'processes', 'documents', 'timelineevents', 'communications'];
  let totalRecords = 0;
  
  tables.forEach(tableName => {
    const count = currentData[tableName] ? currentData[tableName].length : 0;
    totalRecords += count;
  });

  documentation += `**Total Records**: ${totalRecords} across ${tables.length} tables\n\n`;

  // Table summary
  documentation += `| Table | Records | Description |\n`;
  documentation += `|-------|---------|-------------|\n`;
  
  const tableDescriptions = {
    customers: 'Customer companies and organizations',
    contacts: 'Individual contacts within customer organizations',
    teams: 'Customer team structures with finance codes',
    services: 'Service offerings and monthly hour allocations',
    processes: 'Development processes and SDLC workflows',
    documents: 'File attachments and document storage',
    timelineevents: 'Timeline events and process milestones',
    communications: 'Communication logs and interaction history'
  };

  tables.forEach(tableName => {
    const count = currentData[tableName] ? currentData[tableName].length : 0;
    documentation += `| ${tableName} | ${count} | ${tableDescriptions[tableName] || 'Data table'} |\n`;
  });

  documentation += `\n## 📋 Detailed Table Analysis\n\n`;

  // Detailed analysis for each table
  tables.forEach(tableName => {
    const data = currentData[tableName] || [];
    if (data.length > 0) {
      documentation += `### ${tableName.charAt(0).toUpperCase() + tableName.slice(1)} Table\n\n`;
      documentation += `**Records**: ${data.length}\n\n`;
      
      // Sample record structure
      const sampleRecord = data[0];
      documentation += `**Schema Structure**:\n\`\`\`json\n${JSON.stringify(sampleRecord, null, 2)}\n\`\`\`\n\n`;
      
      // Field analysis
      documentation += `**Fields**: ${Object.keys(sampleRecord).length}\n`;
      documentation += `**Field Types**:\n`;
      Object.entries(sampleRecord).forEach(([key, value]) => {
        const type = value === null ? 'null' : typeof value;
        documentation += `- \`${key}\`: ${type}\n`;
      });
      
      // Sample data examples (first 3 records)
      if (data.length > 1) {
        documentation += `\n**Sample Data**:\n`;
        data.slice(0, 3).forEach((record, index) => {
          const displayName = record.name || record.title || record.id || `Record ${index + 1}`;
          documentation += `${index + 1}. **${displayName}**\n`;
          
          // Show key fields only for readability
          const keyFields = ['id', 'name', 'title', 'email', 'phase', 'status', 'type'];
          keyFields.forEach(field => {
            if (record[field]) {
              documentation += `   - ${field}: ${record[field]}\n`;
            }
          });
        });
      }
      
      documentation += `\n---\n\n`;
    }
  });

  // Relationships and dependencies
  documentation += `## 🔗 Table Relationships\n\n`;
  documentation += `### Customer-Centric Data Model\n`;
  documentation += `- **customers** (1) → **contacts** (many)\n`;
  documentation += `- **customers** (1) → **teams** (many)\n`;
  documentation += `- **customers** (1) → **services** (many)\n`;
  documentation += `- **customers** (1) → **processes** (many)\n`;
  documentation += `- **customers** (1) → **documents** (many)\n`;
  documentation += `- **customers** (1) → **timelineevents** (many)\n`;
  documentation += `- **contacts** (1) → **communications** (many)\n`;
  documentation += `- **processes** (1) → **timelineevents** (many)\n\n`;

  // Usage patterns
  documentation += `## 📈 Data Usage Patterns\n\n`;
  
  if (currentData.customers && currentData.customers.length > 0) {
    const phases = {};
    currentData.customers.forEach(customer => {
      phases[customer.phase] = (phases[customer.phase] || 0) + 1;
    });
    documentation += `**Customer Phases**:\n`;
    Object.entries(phases).forEach(([phase, count]) => {
      documentation += `- ${phase}: ${count} customers\n`;
    });
    documentation += `\n`;
  }

  if (currentData.processes && currentData.processes.length > 0) {
    const statuses = {};
    currentData.processes.forEach(process => {
      statuses[process.status] = (statuses[process.status] || 0) + 1;
    });
    documentation += `**Process Statuses**:\n`;
    Object.entries(statuses).forEach(([status, count]) => {
      documentation += `- ${status}: ${count} processes\n`;
    });
    documentation += `\n`;
  }

  // Backup instructions
  documentation += `## 🛠️ Restoration Instructions\n\n`;
  documentation += `### To Restore This Data Structure:\n\n`;
  documentation += `1. **Ensure Schema**: Verify Drizzle schema matches current structure\n`;
  documentation += `2. **Clear Tables**: Remove existing test data if needed\n`;
  documentation += `3. **Import Data**: Use the corresponding SQL backup file\n`;
  documentation += `4. **Verify Relationships**: Check foreign key constraints\n`;
  documentation += `5. **Test Application**: Ensure all functionality works\n\n`;

  documentation += `### Related Files:\n`;
  documentation += `- SQL Backup: \`sales_dashboard_backup_${timestamp}.sql\`\n`;
  documentation += `- Schema Definition: \`shared/schema.ts\`\n`;
  documentation += `- Type Definitions: \`client/src/shared/types.ts\`\n\n`;

  documentation += `### Data Clearing Commands:\n`;
  documentation += `\`\`\`sql\n`;
  documentation += `-- Clear all data (preserves schema)\n`;
  tables.reverse().forEach(tableName => { // Reverse order for foreign keys
    const sqlTableName = tableName.replace('timelineevents', 'timeline_events');
    documentation += `DELETE FROM ${sqlTableName};\n`;
  });
  documentation += `\`\`\`\n\n`;

  documentation += `---\n\n`;
  documentation += `**Generated by**: DM_CRM Database Backup Tool  \n`;
  documentation += `**Backup Date**: ${new Date().toISOString()}  \n`;
  documentation += `**Purpose**: Production deployment preparation  \n`;

  // Write to file
  fs.writeFileSync(filename, documentation, 'utf8');
  console.log(`✅ Database documentation created: ${filename}`);
  console.log(`📊 File size: ${fs.statSync(filename).size} bytes`);
  
  return filename;
}

// Main backup function
async function runBackup() {
  try {
    console.log('🗃️ Starting comprehensive database backup...');
    console.log('📡 Ensuring application is running...');
    
    const currentData = await getCurrentData();
    
    // Generate both backups
    console.log('\n📋 Creating SQL dump backup...');
    const sqlFile = await generateSQLDump(currentData);
    
    console.log('\n📚 Creating database documentation...');
    const docFile = await generateDatabaseDocumentation(currentData);
    
    console.log('\n🎉 Backup complete!');
    console.log(`📁 SQL Backup: ${sqlFile}`);
    console.log(`📁 Documentation: ${docFile}`);
    console.log('\n✅ Ready to clear test data for production deployment.');
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    console.log('\n💡 Make sure the Sales Dashboard application is running:');
    console.log('   npm run dev (or use VS Code task)');
  }
}

// Run the backup
if (require.main === module) {
  runBackup();
}

module.exports = { generateSQLDump, generateDatabaseDocumentation, runBackup };
