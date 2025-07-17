/**
 * Script to create admin user using the existing auth service
 */

import { SupabaseAuthService } from './server/lib/auth/supabaseAuthService.ts';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './server/.env' });

const authService = new SupabaseAuthService();

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    const user = await authService.createUser({
      email: 'admin@test.com',
      password: 'AdminPass123',
      name: 'Admin User',
      role: 'Admin'
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('User ID:', user.id);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    
    console.log('\n🎉 You can now login with:');
    console.log('Email: admin@test.com');
    console.log('Password: AdminPass123');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    
    // If user already exists, that's okay
    if (error.message.includes('already registered')) {
      console.log('User already exists - that\'s okay!');
      console.log('You can login with:');
      console.log('Email: admin@test.com');
      console.log('Password: AdminPass123');
    }
  }
}

createAdminUser();