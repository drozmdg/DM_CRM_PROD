import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lixjjvljdbxlkdxhqfqp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpeGpqdmxqZGJ4bGtkeGhxZnFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4OTQyNzIsImV4cCI6MjA1MjQ3MDI3Mn0.h2OqKPKGNQvKXmJE2nDKDgKMy2U6B8DqEKZFjYq3b1c';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Testing Supabase connection...');

supabase
  .from('communications')
  .select('*')
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.log('❌ Table does not exist:', error.message);
      console.log('✅ Connection works, but table missing');
      
      console.log('\n📝 Please execute this SQL in Supabase Dashboard > SQL Editor:');
      console.log(`
CREATE TABLE IF NOT EXISTS public.communications (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'phone', 'meeting', 'other')),
  subject TEXT NOT NULL,
  notes TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_communications_contact_id ON public.communications(contact_id);

COMMENT ON TABLE public.communications IS 'Communication entries for contacts';
      `);
    } else {
      console.log('✅ Communications table exists and is accessible');
    }
  })
  .catch(err => {
    console.error('❌ Connection error:', err.message);
  });
