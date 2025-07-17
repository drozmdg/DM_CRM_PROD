// Simplified server startup without Vite integration
import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import cors from 'cors';
import { registerRoutes } from "./server/routes.js";
import { log } from "./server/vite.js";
import { storage } from "./server/storage_new.js";
import { applySecurityMiddleware, corsOptions, securityHealthCheck } from "./server/middleware/security.js";

const app = express();

log('🚀 Starting Sales Dashboard API Server...');

// Apply security middleware FIRST
applySecurityMiddleware(app);

// CORS configuration
app.use(cors(corsOptions));

// Body parsing with security limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Initialize storage service to connect to Supabase database
log('Initializing storage service...');
try {
  await storage.initialize();
  log('Storage service initialized successfully');
} catch (error) {
  log('Storage service initialization failed, continuing with reduced functionality:', error);
}

// Security health check endpoint
app.get('/health/security', securityHealthCheck);

// Simple health check for debugging
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

log('About to register routes...');
const server = await registerRoutes(app);
log('Routes registered successfully');

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Global error handler:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Use PORT from environment or default to 3000
const port = parseInt(process.env.PORT || "3000");
server.listen(port, "0.0.0.0", () => {
  log(`🎉 Sales Dashboard API Server running on port ${port}`);
  log(`📍 Health check: http://localhost:${port}/health`);
  log(`🔐 Auth endpoint: http://localhost:${port}/api/auth/login`);
  log(`📊 Customers: http://localhost:${port}/api/customers`);
});