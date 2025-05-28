/**
 * Script to create the communications table in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createCommunicationsTable() {
  console.log('🚀 Creating communications table...');
  
  try {
    // Create the communications table
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS communications (
          id SERIAL PRIMARY KEY,
          contact_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          subject TEXT NOT NULL,
          notes TEXT NOT NULL,
          date TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Create foreign key constraint (if contacts table exists)
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts') THEN
            ALTER TABLE communications 
            ADD CONSTRAINT fk_communications_contact_id 
            FOREIGN KEY (contact_id) REFERENCES contacts(id);
          END IF;
        END
        $$;
      `
    });

    if (error) {
      console.error('❌ Error creating table:', error);
      return false;
    }

    console.log('✅ Communications table created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

// Run the script
createCommunicationsTable()
  .then((success) => {
    if (success) {
      console.log('🎉 Database setup completed!');
    } else {
      console.log('❌ Database setup failed!');
    }
    process.exit(success ? 0 : 1);
  });
