#!/usr/bin/env node
/**
 * Phase 2 Setup Helper Script
 * Automates the database schema creation and initial setup
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function setupDatabase() {
  log('🚀 Starting Phase 2 Database Setup...', 'blue');
  
  // Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey || 
      supabaseUrl.includes('your_supabase_url_here') || 
      supabaseKey.includes('your_supabase_anon_key_here')) {
    log('❌ Please set up your Supabase credentials in .env file first!', 'red');
    log('📝 You need to:', 'yellow');
    log('   1. Create a Supabase project at https://supabase.com', 'yellow');
    log('   2. Copy your Project URL and API Key', 'yellow');
    log('   3. Update the .env file with real credentials', 'yellow');
    process.exit(1);
  }
  
  try {
    // Initialize Supabase client
    log('🔗 Connecting to Supabase...', 'blue');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection
    const { data, error } = await supabase.from('customers').select('count', { count: 'exact', head: true });
    
    if (error && !error.message.includes('relation "customers" does not exist')) {
      throw error;
    }
    
    log('✅ Successfully connected to Supabase!', 'green');
    
    // Read and execute schema
    log('📄 Reading database schema...', 'blue');
    const schemaPath = join(__dirname, 'server', 'database', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    
    log('🏗️  Creating database tables...', 'blue');
    
    // Split schema into individual statements and execute them
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            log(`⚠️  Warning executing: ${statement.substring(0, 50)}...`, 'yellow');
            log(`   Error: ${error.message}`, 'yellow');
          }
        } catch (err) {
          log(`⚠️  Could not execute statement (this might be normal): ${err.message}`, 'yellow');
        }
      }
    }
    
    log('✅ Database schema setup complete!', 'green');
    
    // Test table creation
    log('🧪 Testing table creation...', 'blue');
    const tables = ['customers', 'contacts', 'teams', 'services', 'documents', 'timeline_events', 'chat_sessions', 'users'];
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (error) {
          log(`❌ Table '${table}' not accessible: ${error.message}`, 'red');
        } else {
          log(`✅ Table '${table}' ready`, 'green');
        }
      } catch (err) {
        log(`❌ Error checking table '${table}': ${err.message}`, 'red');
      }
    }
    
    log('🎉 Phase 2 database setup complete!', 'bold');
    log('🔄 Restart your application to use the production database', 'blue');
    
  } catch (error) {
    log(`❌ Setup failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Add sample data creation function
async function createSampleData() {
  log('📊 Creating sample data...', 'blue');
  
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  
  try {
    // Create sample customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        name: 'Acme Corporation',
        phase: 'New Activation',
        avatar_color: '#3b82f6'
      })
      .select()
      .single();
    
    if (customerError) throw customerError;
    log(`✅ Created sample customer: ${customer.name}`, 'green');
    
    // Create sample contact
    const { error: contactError } = await supabase
      .from('contacts')
      .insert({
        name: 'John Smith',
        title: 'Project Manager',
        email: 'john.smith@acme.com',
        phone: '+1-555-123-4567',
        role: 'Primary Contact',
        type: 'Client',
        customer_id: customer.id
      });
    
    if (contactError) throw contactError;
    log('✅ Created sample contact', 'green');
    
    // Create sample team
    const { error: teamError } = await supabase
      .from('teams')
      .insert({
        name: 'Data Analytics Team',
        finance_code: 'DA001',
        customer_id: customer.id
      });
    
    if (teamError) throw teamError;
    log('✅ Created sample team', 'green');
    
    // Create sample service
    const { error: serviceError } = await supabase
      .from('services')
      .insert({
        name: 'Monthly Data Processing',
        monthly_hours: 40,
        customer_id: customer.id
      });
    
    if (serviceError) throw serviceError;
    log('✅ Created sample service', 'green');
    
    log('🎊 Sample data created successfully!', 'bold');
    
  } catch (error) {
    log(`❌ Error creating sample data: ${error.message}`, 'red');
  }
}

// Main execution
if (process.argv.includes('--sample-data')) {
  createSampleData();
} else {
  setupDatabase();
}
