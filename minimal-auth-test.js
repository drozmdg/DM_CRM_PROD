// Minimal authentication test server
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Test if we can connect to Supabase
const SUPABASE_URL = 'https://tavkgymcjrrobjircogi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhdmtneW1janJyb2JqaXJjb2dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczNDY4MDIsImV4cCI6MjA2MjkyMjgwMn0.EyKgNWPt-AKoV1bJgLBRLusk6t6QBvYS4IZJeRsjbc0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      res.status(500).json({ error: error.message });
    } else {
      res.json({ success: true, message: 'Database connection working' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role = 'Viewer' } = req.body;
    
    console.log('Registration attempt:', { email, name, role });
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Create user (simple approach)
    const userId = `user-${Date.now()}`;
    
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        name,
        email,
        role,
        is_active: true,
        email_verified: true,
        password_hash: 'temp-hash-' + password // In real app, use proper hashing
      });

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    res.json({
      success: true,
      data: {
        user: { id: userId, name, email, role }
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test me endpoint (for session validation)
app.get('/api/auth/me', (req, res) => {
  res.status(401).json({ 
    success: false, 
    error: 'No active session - this is expected for initial load' 
  });
});

// Test login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', { email });
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    // Simple user lookup
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, is_active')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    // Simple token (in real app, use proper JWT)
    const accessToken = `token-${user.id}-${Date.now()}`;
    
    res.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        accessToken,
        refreshToken: `refresh-${user.id}-${Date.now()}`,
        expiresAt: Date.now() + 3600000 // 1 hour
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add mock data endpoints for dashboard
app.get('/api/dashboard/metrics', (req, res) => {
  res.json({
    totalCustomers: 5,
    activeProcesses: 3,
    pendingTasks: 8,
    completedThisMonth: 12,
    revenue: 150000,
    customerGrowth: 15.2
  });
});

app.get('/api/customers', (req, res) => {
  res.json([
    { id: '1', name: 'Acme Corp', status: 'active', phase: 'implementation' },
    { id: '2', name: 'TechStart Inc', status: 'active', phase: 'discovery' },
    { id: '3', name: 'Global Solutions', status: 'active', phase: 'testing' }
  ]);
});

app.get('/api/processes', (req, res) => {
  res.json([
    { id: '1', name: 'Data Migration', status: 'in_progress', progress: 75 },
    { id: '2', name: 'System Integration', status: 'pending', progress: 30 },
    { id: '3', name: 'User Training', status: 'completed', progress: 100 }
  ]);
});

app.get('/api/teams', (req, res) => {
  res.json([
    { id: '1', name: 'Development Team', members: 5 },
    { id: '2', name: 'QA Team', members: 3 }
  ]);
});

app.get('/api/services', (req, res) => {
  res.json([
    { id: '1', name: 'Consulting', status: 'active' },
    { id: '2', name: 'Implementation', status: 'active' }
  ]);
});

app.get('/api/products', (req, res) => {
  res.json([
    { id: '1', name: 'CRM Platform', version: '2.1' }
  ]);
});

app.get('/api/contacts', (req, res) => {
  res.json([
    { id: '1', name: 'John Smith', email: 'john@acme.com', company: 'Acme Corp' }
  ]);
});

app.get('/api/documents', (req, res) => {
  res.json([
    { id: '1', name: 'Project Proposal.pdf', size: 1024000 }
  ]);
});

app.get('/api/tasks/upcoming', (req, res) => {
  res.json([
    { id: '1', title: 'Complete user testing', dueDate: '2025-07-20', priority: 'high' },
    { id: '2', title: 'Deploy to staging', dueDate: '2025-07-22', priority: 'medium' }
  ]);
});

const port = 3001;
app.listen(port, () => {
  console.log(`🚀 Minimal auth test server running on port ${port}`);
  console.log(`📍 Authentication endpoints:`);
  console.log(`   GET  http://localhost:${port}/health`);
  console.log(`   GET  http://localhost:${port}/api/test-db`);
  console.log(`   POST http://localhost:${port}/api/auth/register`);
  console.log(`   POST http://localhost:${port}/api/auth/login`);
  console.log(`📊 Data endpoints:`);
  console.log(`   GET  http://localhost:${port}/api/dashboard/metrics`);
  console.log(`   GET  http://localhost:${port}/api/customers`);
  console.log(`   GET  http://localhost:${port}/api/processes`);
  console.log(`   ... and more data endpoints`);
});