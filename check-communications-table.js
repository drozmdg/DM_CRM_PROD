/**
 * Simple script to create the communications table using Supabase
 */

import { supabase } from './server/lib/supabase.js';

async function createTable() {
  console.log('🚀 Creating communications table...');
  
  try {
    // Use the SQL query approach
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'communications')
      .limit(1);

    if (error) {
      console.error('❌ Error checking table:', error);
    } else if (data && data.length > 0) {
      console.log('✅ Communications table already exists');
      return true;
    }

    // Create the table using raw SQL
    console.log('📝 Creating new communications table...');
    
    const createTableSQL = `
      CREATE TABLE public.communications (
          id SERIAL PRIMARY KEY,
          contact_id INTEGER NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('email', 'phone', 'meeting', 'other')),
          subject TEXT NOT NULL,
          notes TEXT NOT NULL,
          date TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX idx_communications_contact_id ON public.communications(contact_id);
      ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Allow all operations on communications" ON public.communications FOR ALL USING (true);
      GRANT ALL ON TABLE public.communications TO anon, authenticated;
      GRANT USAGE, SELECT ON SEQUENCE public.communications_id_seq TO anon, authenticated;
    `;

    // Since we can't execute DDL directly, let's just test the connection
    const { data: testData, error: testError } = await supabase
      .from('communications')
      .select('*')
      .limit(1);

    if (testError && testError.code === '42P01') {
      console.log('❌ Table does not exist. Please create it manually in Supabase dashboard.');
      console.log('📝 SQL to execute:');
      console.log(createTableSQL);
      return false;
    } else if (testError) {
      console.error('❌ Other error:', testError);
      return false;
    } else {
      console.log('✅ Communications table exists and is accessible');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

createTable()
  .then((success) => {
    if (success) {
      console.log('🎉 Table check completed!');
    } else {
      console.log('❌ Please create the table manually');
    }
    process.exit(success ? 0 : 1);
  });
