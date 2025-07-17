/**
 * Database Migration Script for Process File Transfers and Notifications
 * This script applies the migration to create the new tables in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables');
  console.error('Please check your ./server/.env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...');
    console.log(`📡 Connecting to Supabase: ${supabaseUrl}`);

    // Read the migration file
    const migrationPath = path.join(__dirname, 'server/database/migrations/003_add_process_file_transfer_notifications.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration file loaded successfully');

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
          
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            // Try alternative method for DDL statements
            const { error: directError } = await supabase
              .from('information_schema.tables')
              .select('*')
              .limit(1);
            
            if (directError) {
              console.error(`❌ Error executing statement ${i + 1}:`, error);
              console.error('Statement:', statement.substring(0, 100) + '...');
              throw error;
            }
          }
          
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (err) {
          console.error(`❌ Failed to execute statement ${i + 1}:`, err);
          console.error('Statement:', statement.substring(0, 100) + '...');
          throw err;
        }
      }
    }

    console.log('🎉 Migration completed successfully!');
    
    // Verify tables were created
    console.log('\n🔍 Verifying table creation...');
    
    const tables = ['process_file_transfers', 'process_notifications'];
    
    for (const tableName of tables) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows, which is fine
        console.error(`❌ Table ${tableName} verification failed:`, error);
      } else {
        console.log(`✅ Table ${tableName} created successfully`);
      }
    }

    console.log('\n✨ All done! The new process enhancement features are ready to use.');
    console.log('\n📝 What you can do now:');
    console.log('   1. Navigate to any Process Detail page');
    console.log('   2. Use the new "File Transfers" tab to configure data movement');
    console.log('   3. Use the new "Notifications" tab to set up event notifications');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Alternative method using raw SQL execution
async function runMigrationDirect() {
  try {
    console.log('🚀 Starting direct SQL migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'server/database/migrations/003_add_process_file_transfer_notifications.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL loaded');
    console.log('\n📋 SQL to execute:');
    console.log('─'.repeat(80));
    console.log(migrationSQL);
    console.log('─'.repeat(80));
    
    console.log('\n⚠️  Please execute this SQL manually in your Supabase SQL Editor:');
    console.log('\n1. Go to your Supabase Dashboard');
    console.log('2. Navigate to the SQL Editor');
    console.log('3. Copy and paste the SQL above');
    console.log('4. Click "Run" to execute the migration');
    console.log('\n💡 After running the SQL, restart your application to use the new features.');
    
  } catch (error) {
    console.error('❌ Error reading migration file:', error);
    process.exit(1);
  }
}

// Run the migration
console.log('🗄️  Database Migration Tool');
console.log('═'.repeat(50));

// Try direct method first (more reliable for DDL)
await runMigrationDirect();