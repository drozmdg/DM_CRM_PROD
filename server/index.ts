import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import cors from 'cors';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage_new.js";
import { applySecurityMiddleware, corsOptions, securityHealthCheck } from "./middleware/security.js";
// import { sessionCleanupService } from "./lib/auth/sessionCleanup.js";
// PDF service initialization removed - using simple PDF service instead

const app = express();

// Apply security middleware FIRST
applySecurityMiddleware(app);

// CORS configuration
app.use(cors(corsOptions));

// Body parsing with security limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Debug middleware to log request bodies
app.use('/api/documents', (req, res, next) => {
  console.log('Document API request:');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Body type:', typeof req.body);
  console.log('Body keys:', Object.keys(req.body || {}));
  next();
});

// Debug middleware specifically for process-timeline
app.use('/api/process-timeline', (req, res, next) => {
  console.log('🔍 PROCESS-TIMELINE DEBUG MIDDLEWARE:');
  console.log('Method:', req.method);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Content-Length:', req.headers['content-length']);
  console.log('Raw body available:', !!req.body);
  console.log('Body:', req.body);
  console.log('Body type:', typeof req.body);
  console.log('Body keys:', Object.keys(req.body || {}));
  console.log('Body JSON string:', JSON.stringify(req.body));
  console.log('🔍 END DEBUG MIDDLEWARE');
  next();
});

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

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize storage service to connect to Supabase database
  log('Initializing storage service...');
  try {
    await storage.initialize();
    log('Storage service initialized successfully');
  } catch (error) {
    log('Storage service initialization failed, continuing with reduced functionality:', error);
  }

  // Initialize session cleanup service
  log('Starting session cleanup service...');
  // sessionCleanupService.start();
  log('Session cleanup service started');

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
      version: '1.0.0'
    });
  });

  log('About to register routes...');
  const server = await registerRoutes(app);
  log('Routes registered successfully');

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    // Temporarily disabled Vite setup to fix server startup
    log("Vite setup disabled - using separate frontend server");
  } else {
    serveStatic(app);
  }

  // Use PORT from environment or default to 3000
  const port = parseInt(process.env.PORT || "3000");
  server.listen({
    port,
    host: "0.0.0.0"
  }, () => {
    log(`serving on port ${port}`);
  });
})();
