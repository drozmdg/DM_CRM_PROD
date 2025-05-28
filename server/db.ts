import * as schema from "@shared/schema";

// Use mock database for standalone operation
const USE_MOCK_DB = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('placeholder');

let db: any;
let mockData: any = null;
let getMockData: any = null;

if (USE_MOCK_DB) {
  console.log('🔧 Using mock database with test data for standalone operation');
  // Mock database implementation is handled in storage layer
  db = null; // Not used in mock mode
} else {
  // Real database setup (for when you have a real DATABASE_URL)
  const { Pool, neonConfig } = require('@neondatabase/serverless');
  const { drizzle } = require('drizzle-orm/neon-serverless');
  const ws = require('ws');
  
  neonConfig.webSocketConstructor = ws.default;
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
}

export { db, mockData, getMockData };