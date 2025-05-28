/**
 * Direct table creation script for communications table
 */
import { createClient } from '@supabase/supabase-js';

// Read environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'https://lixjjvljdbxlkdxhqfqp.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpeGpqdmxqZGJ4bGtkeGhxZnFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4OTQyNzIsImV4cCI6MjA1MjQ3MDI3Mn0.h2OqKPKGNQvKXmJE2nDKDgKMy2U6B8DqEKZFjYq3b1c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createCommunicationsTable() {
  try {
    console.log('🏗️ Creating communications table...');
    
    // First check if table exists
    const { data: existingTable, error: checkError } = await supabase
      .from('communications')
      .select('*')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ Communications table already exists');
      return;
    }
    
    // Table doesn't exist, create it
    const { data, error } = await supabase.rpc('create_communications_table');
    
    if (error) {
      console.error('❌ Error creating table via RPC:', error);
      
      // Try alternative approach - direct SQL
      console.log('🔄 Trying direct SQL approach...');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.communications (
          id SERIAL PRIMARY KEY,
          contact_id INTEGER NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('email', 'phone', 'meeting', 'other')),
          subject TEXT NOT NULL,
          notes TEXT NOT NULL,
          date TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );
        
        -- Add index for performance
        CREATE INDEX IF NOT EXISTS idx_communications_contact_id ON public.communications(contact_id);
        
        -- Add comments
        COMMENT ON TABLE public.communications IS 'Communication entries for contacts';
        COMMENT ON COLUMN public.communications.contact_id IS 'Reference to contact';
        COMMENT ON COLUMN public.communications.type IS 'Type of communication: email, phone, meeting, other';
      `;
      
      // Note: We can't execute DDL directly via the JS client
      console.log('📝 SQL to execute in Supabase dashboard:');
      console.log(createTableSQL);
      
    } else {
      console.log('✅ Communications table created successfully');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function testTableCreation() {
  await createCommunicationsTable();
  
  // Test if we can now query the table
  try {
    const { data, error } = await supabase
      .from('communications')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('❌ Table still not accessible:', error.message);
    } else {
      console.log('✅ Communications table is now accessible');
    }
  } catch (error) {
    console.error('❌ Error testing table:', error);
  }
}

testTableCreation();
