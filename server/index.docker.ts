import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import cors from 'cors';
import { registerRoutes } from "./routes";
import { storage } from "./storage_new.js";
import { applySecurityMiddleware, corsOptions, securityHealthCheck } from "./middleware/security.js";

const app = express();

// Apply security middleware FIRST
applySecurityMiddleware(app);

// CORS configuration
app.use(cors(corsOptions));

// Body parsing with security limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Simple logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(`[${new Date().toLocaleTimeString()}] ${logLine}`);
    }
  });

  next();
});

function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

(async () => {
  // Initialize storage service to connect to PostgreSQL database
  log('Initializing storage service...');
  try {
    await storage.initialize();
    log('Storage service initialized successfully');
  } catch (error) {
    log('Storage service initialization failed, continuing with reduced functionality:');
    console.error(error);
  }

  // PDF service: Using simple jsPDF-based service (no browser automation required)
  log('PDF service: Simple PDF generation ready');

  // Security health check endpoint
  app.get('/health/security', securityHealthCheck);
  
  // Simple health check for debugging
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API health check for Docker container monitoring
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'SalesDashboard API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  });

  log('About to register routes...');
  const server = await registerRoutes(app);
  log('Routes registered successfully');

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error('Server error:', err);
  });

  // For Docker, we only serve the API - frontend will be separate
  log("Docker mode: Serving API only (frontend served separately)");

  // Use PORT from environment or default to 3000
  const port = parseInt(process.env.PORT || "3000");
  server.listen({
    port,
    host: "0.0.0.0"
  }, () => {
    log(`🚀 Sales Dashboard API serving on port ${port}`);
    log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    log(`Database: ${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}`);
  });
})();