// Test server startup with detailed logging
import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import cors from 'cors';

console.log('🚀 Starting server test...');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Test endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test if storage can be imported and initialized
try {
  console.log('📦 Importing storage...');
  const { storage } = await import('./server/storage_new.js');
  console.log('✅ Storage imported successfully');
  
  console.log('🔧 Initializing storage...');
  await storage.initialize();
  console.log('✅ Storage initialized successfully');
  
  console.log('📦 Importing routes...');
  const { registerRoutes } = await import('./server/routes.js');
  console.log('✅ Routes imported successfully');
  
  console.log('🔧 Registering routes...');
  const server = await registerRoutes(app);
  console.log('✅ Routes registered successfully');
  
  // Start server
  const port = 3000;
  server.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📍 Health check: http://localhost:${port}/health`);
  });
  
} catch (error) {
  console.error('❌ Startup error:', error);
  console.error('Error details:', error.stack);
}