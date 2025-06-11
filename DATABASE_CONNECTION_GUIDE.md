# Database Connection & Query Guide for Sales Dashboard

## Overview
This document provides step-by-step instructions for successfully connecting to and querying the Supabase database in the Sales Dashboard project.

## Prerequisites
- Supabase credentials properly configured in `.env` file
- Node.js and npm installed
- Project dependencies installed (`npm install`)

## Database Connection Steps

### 1. Environment Setup
Ensure your `.env` file contains:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### 2. Server Startup Process

#### Check for Port Conflicts
```powershell
# Check if port 5000 is in use
netstat -ano | findstr :5000

# If port is in use, kill the process
taskkill /PID [process_id] /F
```

#### Start the Development Server
```powershell
cd "p:\replit_files\SalesDashboard\SalesDashboard"
npm run dev
```

**Expected Output:**
```
> rest-express@1.0.0 dev
> cross-env NODE_ENV=development tsx server/index.ts
2:08:19 PM [express] serving on port 5000
```

### 3. Database Connection Verification

#### Test Basic Connection
```javascript
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Test connection
const { data, error } = await supabase
  .from('customers')
  .select('count', { count: 'exact', head: true });
```

#### Verify API Endpoints
```powershell
# Test dashboard metrics endpoint
curl -X GET http://localhost:5000/api/dashboard/metrics

# Expected response format:
# {"customers":{"total":6,"byPhase":{"Steady State":2,"New Activation":4}}}
```

### 4. Common Issues and Solutions

#### Issue: Port Already in Use
**Error:** `Error: listen EADDRINUSE: address already in use 0.0.0.0:5000`

**Solution:**
```powershell
netstat -ano | findstr :5000
taskkill /PID [process_id] /F
npm run dev
```

#### Issue: Column Does Not Exist
**Error:** `column customers.company_name does not exist`

**Solution:** Use correct column names from schema:
- `name` (not `company_name`)
- `active` (boolean)
- `phase` (string)
- `created_at` (timestamp)

#### Issue: Supabase Connection Failed
**Error:** `Database connection failed`

**Solution:**
1. Verify `.env` file has correct credentials
2. Check network connectivity
3. Verify Supabase project is active

### 5. Database Schema Reference

#### Customers Table Structure
```sql
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  avatar_color TEXT,
  phase TEXT,
  contract_start_date DATE,
  contract_end_date DATE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  active BOOLEAN DEFAULT true,
  inactivated_at TIMESTAMP
);
```

#### Common Query Patterns

**Get Active Customers Only:**
```javascript
const { data: activeCustomers } = await supabase
  .from('customers')
  .select('*')
  .eq('active', true);
```

**Get Customer Count by Phase:**
```javascript
const { data: customers } = await supabase
  .from('customers')
  .select('phase')
  .eq('active', true);

const byPhase = {};
customers.forEach(customer => {
  byPhase[customer.phase] = (byPhase[customer.phase] || 0) + 1;
});
```

### 6. Testing and Verification

#### Use the Verification Script
Run the custom verification script to check customer counts:
```powershell
node verify-customer-count.js
```

This script will:
- Test database connection
- Show total vs active customer counts
- List all customers with their status
- Identify any data inconsistencies

#### Check Schema
```powershell
node check_schema.js
```

### 7. API Testing

#### Dashboard Metrics
```powershell
curl -X GET http://localhost:5000/api/dashboard/metrics
```

#### Customer API
```powershell
curl -X GET http://localhost:5000/api/customers
```

## Troubleshooting Checklist

1. **Environment Variables**
   - [ ] SUPABASE_URL is set
   - [ ] SUPABASE_ANON_KEY is set
   - [ ] No trailing slashes in URL

2. **Server Status**
   - [ ] Port 5000 is available
   - [ ] Development server is running
   - [ ] No compilation errors

3. **Database Connection**
   - [ ] Supabase project is active
   - [ ] Network connectivity is working
   - [ ] Credentials are valid

4. **Query Syntax**
   - [ ] Using correct column names
   - [ ] Proper error handling
   - [ ] Correct data types

## Success Indicators

When everything is working correctly, you should see:
- Server starts without errors on port 5000
- API endpoints return JSON responses
- Customer count matches UI display
- Active/inactive filtering works properly

## Last Updated
May 29, 2025

---
*This guide was created after resolving the customer count discrepancy issue where the dashboard was correctly showing 6 active customers out of 7 total customers.*
