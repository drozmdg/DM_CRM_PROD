import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";

// Mock user for standalone mode
const MOCK_USER = {
  id: "demo-user-123",
  username: "demo",
  displayName: "Demo User",
  email: "demo@example.com"
};

export async function setupAuth(app: Express): Promise<void> {
  // Set up session middleware for mock auth
  const MemoryStore = (await import('memorystore')).default(session);
  
  app.use(session({
    secret: process.env.SESSION_SECRET || 'mock-session-secret-for-standalone',
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for local development
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  }));
  // Auto-login middleware - automatically authenticate all requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user) {
      req.session.user = MOCK_USER;
    }
    // Also set user on request object for compatibility
    (req as any).user = req.session.user;
    next();
  });
  // Mock login endpoint for compatibility
  app.get("/api/auth/login", (req: Request, res: Response) => {
    req.session.user = MOCK_USER;
    res.redirect("/");
  });

  // Mock logout endpoint
  app.get("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
      }
      res.redirect("/");
    });
  });
  // User info endpoint
  app.get("/api/auth/user", (req: Request, res: Response) => {
    if (req.session.user) {
      res.json(req.session.user);
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });
}

// Middleware to check if user is authenticated (always true in mock mode)
export function isAuthenticated(req: Request, res: Response, next: NextFunction): void {
  if (req.session.user) {
    next();
  } else {
    // This shouldn't happen in mock mode, but just in case
    req.session.user = MOCK_USER;
    next();
  }
}

// Extend the session interface to include user
declare module "express-session" {
  interface SessionData {
    user?: {
      id: string;
      username: string;
      displayName: string;
      email: string;
    };
  }
}
