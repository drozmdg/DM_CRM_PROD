// Test server imports individually
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

console.log('✅ Basic imports work');

try {
  console.log('Testing supabase import...');
  const { supabase } = await import('./server/lib/supabase.js');
  console.log('✅ Supabase import works');
  
  console.log('Testing database service import...');
  const { databaseService } = await import('./server/lib/database/index.js');
  console.log('✅ Database service import works');
  
  console.log('Testing storage import...');
  const { storage } = await import('./server/storage_new.js');
  console.log('✅ Storage import works');
  
  console.log('Testing auth service import...');
  const { SupabaseAuthService } = await import('./server/lib/auth/supabaseAuthService.js');
  console.log('✅ Auth service import works');
  
  console.log('Testing routes import...');
  const { registerRoutes } = await import('./server/routes.js');
  console.log('✅ Routes import works');
  
  console.log('🎉 All imports successful!');
  
} catch (error) {
  console.error('❌ Import error:', error);
  console.error('Error details:', error.stack);
}