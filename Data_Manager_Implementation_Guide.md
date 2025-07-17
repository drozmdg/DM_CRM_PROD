# Data Manager Implementation Guide

> **[IMPORTANT] Current Project Status: NOT IMPLEMENTED**
>
> The features described in this document, including Data Manager authentication, login, and customer assignments, **are not currently implemented in the project.**
>
> The project is in **"INTERNAL DEMO MODE"** with all authentication systems completely removed, as stated in the main `README.md`. All users have full access to all data without requiring a login.
>
> This guide should be considered an **aspirational design document or a historical artifact** of a planned feature. The database tables, API endpoints, and frontend components described below **DO NOT EXIST** in the current codebase.

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Changes](#database-changes)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Configuration Management](#configuration-management)
7. [Security Hardening](#security-hardening)
8. [Concurrency Control](#concurrency-control)
9. [Observability & Monitoring](#observability--monitoring)
10. [Accessibility Standards](#accessibility-standards)
11. [Testing Strategy](#testing-strategy)
12. [Deployment Guide](#deployment-guide)
13. [Maintenance & Troubleshooting](#maintenance--troubleshooting)

## Overview

This guide implements a data manager authentication and customer assignment system for the Sales Dashboard CRM. The solution allows 5 data managers to log in, manage their assigned customers, and be automatically available for task assignments.

### Key Requirements
- 5 Data Managers with individual login credentials
- Many-to-many customer assignments (DMs can have multiple customers, customers can have multiple DMs)
- Primary responsibility tracking (one DM is the main contact per customer)
- Automatic inclusion in task assignment dropdowns
- Customer filtering based on assignments
- Minimal disruption to existing functionality

### Design Principles
- **Leverage Existing Infrastructure**: Use contacts system for task assignments
- **Simple Authentication**: Session-based auth, no complex permissions
- **Clean Separation**: Auth layer separate from business logic
- **Backward Compatibility**: All existing features continue working
- **Scalability**: Easy to add more data managers later

## Architecture

### System Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Login Page    │───▶│  Auth Middleware │───▶│  Customer List  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Session Storage │    │  Data Managers  │    │ Customer Filters│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   DM Contacts   │◀───│ Customer-DM     │───▶│ Task Assignment │
└─────────────────┘    │   Junction      │    └─────────────────┘
                       └─────────────────┘
```

### Authentication Flow
1. **Login**: DM enters credentials → Session created → Redirect to dashboard
2. **Session Check**: Middleware validates session on protected routes
3. **Customer Filter**: API queries filtered by DM assignments
4. **Task Assignment**: DM appears in contact dropdowns automatically
5. **Logout**: Session destroyed → Redirect to login

### Data Relationships
```
data_managers (1) ←──→ (M) customer_data_managers (M) ←──→ (1) customers
      │                                                          │
      └──────────────── (1) ←──→ (M) contacts ←──────────────────┘
                                      │
                                      ▼
                               process_tasks
```

## Database Changes

> **Note:** The following database migrations describe a planned feature and **have not been implemented**. The tables `data_managers`, `contact_types`, `customer_data_managers`, and `dm_sessions` do not exist in the current database schema.

### Migration 1: Create Data Managers Table
```sql
-- File: server/database/migrations/006_create_data_managers.sql
-- [NOT IMPLEMENTED] Create data managers table for authentication
CREATE TABLE data_managers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for login performance
CREATE INDEX idx_data_managers_email ON data_managers(email);
CREATE INDEX idx_data_managers_active ON data_managers(is_active);

-- Add update trigger
CREATE TRIGGER update_data_managers_updated_at 
  BEFORE UPDATE ON data_managers 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- [NOT IMPLEMENTED] Insert 5 data managers (passwords should be hashed in production)
INSERT INTO data_managers (name, email, password_hash) VALUES
  ('Alice Johnson', 'alice.johnson@company.com', '$2b$10$placeholder_hash_1'),
  ('Bob Smith', 'bob.smith@company.com', '$2b$10$placeholder_hash_2'),
  ('Carol Davis', 'carol.davis@company.com', '$2b$10$placeholder_hash_3'),
  ('David Wilson', 'david.wilson@company.com', '$2b$10$placeholder_hash_4'),
  ('Emma Brown', 'emma.brown@company.com', '$2b$10$placeholder_hash_5');
```

### Migration 2: Create Contact Types Lookup Table and Junction Table
```sql
-- File: server/database/migrations/007_add_dm_contact_system.sql
-- [NOT IMPLEMENTED] Create contact types lookup table (replaces enum for easier management)
CREATE TABLE contact_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert existing contact types
INSERT INTO contact_types (name, description) VALUES
  ('Client', 'External client contacts'),
  ('Internal', 'Internal company contacts'),
  ('Vendor', 'Vendor contacts'),
  ('Partner', 'Partner contacts'),
  ('Consultant', 'Consultant contacts'),
  ('External Stakeholder', 'External stakeholder contacts'),
  ('Data Manager', 'Internal data managers');

-- Add contact_type_id column to contacts table
ALTER TABLE contacts ADD COLUMN contact_type_id UUID REFERENCES contact_types(id);

-- Migrate existing contact type data
UPDATE contacts SET contact_type_id = (
  SELECT id FROM contact_types WHERE name = contacts.type
);

-- Make contact_type_id required after migration
ALTER TABLE contacts ALTER COLUMN contact_type_id SET NOT NULL;

-- Create customer-data manager assignments with concurrency protection
CREATE TABLE customer_data_managers (
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  data_manager_id UUID REFERENCES data_managers(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES data_managers(id),
  notes TEXT,
  version INTEGER DEFAULT 1, -- For optimistic locking
  PRIMARY KEY (customer_id, data_manager_id)
);

-- Add primary manager reference to customers
ALTER TABLE customers ADD COLUMN primary_manager_id UUID REFERENCES data_managers(id);

-- Create indexes for performance
CREATE INDEX idx_contact_types_name ON contact_types(name);
CREATE INDEX idx_contact_types_active ON contact_types(is_active);
CREATE INDEX idx_contacts_contact_type_id ON contacts(contact_type_id);
CREATE INDEX idx_customer_data_managers_customer_id ON customer_data_managers(customer_id);
CREATE INDEX idx_customer_data_managers_data_manager_id ON customer_data_managers(data_manager_id);
CREATE INDEX idx_customer_data_managers_is_primary ON customer_data_managers(is_primary);
CREATE INDEX idx_customers_primary_manager_id ON customers(primary_manager_id);

-- Ensure only one primary manager per customer with proper concurrency handling
CREATE UNIQUE INDEX idx_customer_primary_manager 
ON customer_data_managers(customer_id) 
WHERE is_primary = true;

-- Add constraint to ensure primary manager is also assigned
ALTER TABLE customers ADD CONSTRAINT fk_primary_manager_assigned
  CHECK (
    primary_manager_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM customer_data_managers 
      WHERE customer_id = customers.id 
      AND data_manager_id = customers.primary_manager_id
    )
  );

-- Drop old type column after successful migration
-- ALTER TABLE contacts DROP COLUMN type; -- Uncomment after verification
```

### Migration 3: Sessions and Contact Auto-Creation
```sql
-- File: server/database/migrations/008_sessions_and_contacts.sql
-- [NOT IMPLEMENTED] Create sessions table for authentication
CREATE TABLE dm_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  data_manager_id UUID REFERENCES data_managers(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for session lookups
CREATE INDEX idx_dm_sessions_token ON dm_sessions(session_token);
CREATE INDEX idx_dm_sessions_expires ON dm_sessions(expires_at);

-- Function to auto-create DM contacts when assigned to customers
CREATE OR REPLACE FUNCTION create_dm_contact()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if DM contact already exists for this customer
  IF NOT EXISTS (
    SELECT 1 FROM contacts 
    WHERE customer_id = NEW.customer_id 
    AND email = (SELECT email FROM data_managers WHERE id = NEW.data_manager_id)
  ) THEN
    -- Create contact record for the data manager
    INSERT INTO contacts (
      name, 
      email, 
      type, 
      role, 
      customer_id,
      title
    )
    SELECT 
      dm.name,
      dm.email,
      'Data Manager',
      'Data Manager',
      NEW.customer_id,
      CASE WHEN NEW.is_primary THEN 'Primary Data Manager' ELSE 'Data Manager' END
    FROM data_managers dm 
    WHERE dm.id = NEW.data_manager_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create contacts
CREATE TRIGGER trigger_create_dm_contact
  AFTER INSERT ON customer_data_managers
  FOR EACH ROW EXECUTE FUNCTION create_dm_contact();

-- Update contact titles when primary status changes
CREATE OR REPLACE FUNCTION update_dm_contact_title()
RETURNS TRIGGER AS $$
BEGIN
  -- Update contact title based on primary status
  UPDATE contacts 
  SET title = CASE 
    WHEN NEW.is_primary THEN 'Primary Data Manager' 
    ELSE 'Data Manager' 
  END
  WHERE customer_id = NEW.customer_id 
  AND email = (SELECT email FROM data_managers WHERE id = NEW.data_manager_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for title updates
CREATE TRIGGER trigger_update_dm_contact_title
  AFTER UPDATE OF is_primary ON customer_data_managers
  FOR EACH ROW EXECUTE FUNCTION update_dm_contact_title();
```

## Backend Implementation

> **Note:** The following backend services, middleware, and API routes **are not implemented** in the current codebase. They represent a planned design.

### 1. Authentication Service
```typescript
// File: server/lib/auth/authService.ts
// [NOT IMPLEMENTED]
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { supabase } from '../supabase.js';

export interface DataManager {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  lastLogin?: string;
}

export interface Session {
  id: string;
  dataManagerId: string;
  sessionToken: string;
  expiresAt: string;
}

export class AuthService {
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  async login(email: string, password: string): Promise<{ dataManager: DataManager; sessionToken: string } | null> {
    try {
      // Get data manager by email
      const { data: dm, error } = await supabase
        .from('data_managers')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .single();

      if (error || !dm) return null;

      // Verify password
      const isValid = await bcrypt.compare(password, dm.password_hash);
      if (!isValid) return null;

      // Create session
      const sessionToken = randomUUID();
      const expiresAt = new Date(Date.now() + this.SESSION_DURATION).toISOString();

      const { error: sessionError } = await supabase
        .from('dm_sessions')
        .insert({
          data_manager_id: dm.id,
          session_token: sessionToken,
          expires_at: expiresAt
        });

      if (sessionError) throw sessionError;

      // Update last login
      await supabase
        .from('data_managers')
        .update({ last_login: new Date().toISOString() })
        .eq('id', dm.id);

      return {
        dataManager: {
          id: dm.id,
          name: dm.name,
          email: dm.email,
          isActive: dm.is_active,
          lastLogin: dm.last_login
        },
        sessionToken
      };
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }

  async validateSession(sessionToken: string): Promise<DataManager | null> {
    try {
      const { data: session, error } = await supabase
        .from('dm_sessions')
        .select(`
          *,
          data_managers (*)
        `)
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !session) return null;

      return {
        id: session.data_managers.id,
        name: session.data_managers.name,
        email: session.data_managers.email,
        isActive: session.data_managers.is_active,
        lastLogin: session.data_managers.last_login
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  async logout(sessionToken: string): Promise<void> {
    try {
      await supabase
        .from('dm_sessions')
        .delete()
        .eq('session_token', sessionToken);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async cleanupExpiredSessions(): Promise<void> {
    try {
      await supabase
        .from('dm_sessions')
        .delete()
        .lt('expires_at', new Date().toISOString());
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
  }
}

export const authService = new AuthService();
```

### 2. Authentication Middleware
```typescript
// File: server/lib/auth/middleware.ts
// [NOT IMPLEMENTED]
import { Request, Response, NextFunction } from 'express';
import { authService } from './authService.js';

export interface AuthenticatedRequest extends Request {
  currentDataManager?: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '') || 
                        req.cookies?.sessionToken;

    if (!sessionToken) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const dataManager = await authService.validateSession(sessionToken);
    if (!dataManager) {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    req.currentDataManager = dataManager;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};

// Optional middleware - allows both authenticated and guest access
export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '') || 
                        req.cookies?.sessionToken;

    if (sessionToken) {
      const dataManager = await authService.validateSession(sessionToken);
      if (dataManager) {
        req.currentDataManager = dataManager;
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even if auth fails
  }
};
```

### 3. Data Manager Service
```typescript
// File: server/lib/database/dataManagerService.ts
// [NOT IMPLEMENTED]
import { supabase } from '../supabase.js';

export interface CustomerAssignment {
  customerId: string;
  customerName: string;
  isPrimary: boolean;
  assignedAt: string;
  notes?: string;
}

export class DataManagerService {
  async getAssignedCustomers(dataManagerId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('customer_data_managers')
        .select('customer_id')
        .eq('data_manager_id', dataManagerId);

      if (error) throw error;
      return data.map(item => item.customer_id);
    } catch (error) {
      console.error('Error fetching assigned customers:', error);
      throw error;
    }
  }

  async assignCustomer(
    customerId: string, 
    dataManagerId: string, 
    isPrimary: boolean = false,
    assignedBy?: string,
    notes?: string
  ): Promise<void> {
    try {
      // If setting as primary, remove primary from others
      if (isPrimary) {
        await supabase
          .from('customer_data_managers')
          .update({ is_primary: false })
          .eq('customer_id', customerId);
      }

      // Insert or update assignment
      const { error } = await supabase
        .from('customer_data_managers')
        .upsert({
          customer_id: customerId,
          data_manager_id: dataManagerId,
          is_primary: isPrimary,
          assigned_by: assignedBy,
          notes: notes
        });

      if (error) throw error;

      // Update customer's primary manager if applicable
      if (isPrimary) {
        await supabase
          .from('customers')
          .update({ primary_manager_id: dataManagerId })
          .eq('id', customerId);
      }
    } catch (error) {
      console.error('Error assigning customer:', error);
      throw error;
    }
  }

  async unassignCustomer(customerId: string, dataManagerId: string): Promise<void> {
    try {
      // Remove assignment
      const { error } = await supabase
        .from('customer_data_managers')
        .delete()
        .eq('customer_id', customerId)
        .eq('data_manager_id', dataManagerId);

      if (error) throw error;

      // Remove primary manager if this was the primary
      const { data: customer } = await supabase
        .from('customers')
        .select('primary_manager_id')
        .eq('id', customerId)
        .single();

      if (customer?.primary_manager_id === dataManagerId) {
        await supabase
          .from('customers')
          .update({ primary_manager_id: null })
          .eq('id', customerId);
      }
    } catch (error) {
      console.error('Error unassigning customer:', error);
      throw error;
    }
  }

  async getCustomerAssignments(customerId: string): Promise<CustomerAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('customer_data_managers')
        .select(`
          *,
          data_managers (name),
          customers (name)
        `)
        .eq('customer_id', customerId);

      if (error) throw error;

      return data.map(item => ({
        customerId: item.customer_id,
        customerName: item.customers.name,
        isPrimary: item.is_primary,
        assignedAt: item.assigned_at,
        notes: item.notes
      }));
    } catch (error) {
      console.error('Error fetching customer assignments:', error);
      throw error;
    }
  }
}

export const dataManagerService = new DataManagerService();
```

### 4. Updated Customer Service
```typescript
// File: server/lib/database/customerService.ts (additions)
// [NOT IMPLEMENTED]
import { dataManagerService } from './dataManagerService.js';

// Add to existing CustomerService class:
async getAllCustomersForDM(dataManagerId?: string, includeInactive: boolean = false): Promise<Customer[]> {
  try {
    let query = supabase
      .from('customers')
      .select(`
        *,
        teams (*),
        contacts (*),
        documents (*),
        services (*),
        data_managers!primary_manager_id (name, email)
      `)
      .order('name');

    // Filter by assigned customers if DM specified
    if (dataManagerId) {
      const assignedCustomerIds = await dataManagerService.getAssignedCustomers(dataManagerId);
      if (assignedCustomerIds.length === 0) {
        return []; // No assigned customers
      }
      query = query.in('id', assignedCustomerIds);
    }

    // Filter out inactive customers unless explicitly requested
    if (!includeInactive) {
      query = query.eq('active', true);
    }

    const { data: customers, error } = await query;

    if (error) throw error;

    // Transform database rows to Customer objects
    return customers.map(this.transformCustomerRowWithDM);
  } catch (error) {
    console.error('Error fetching customers for DM:', error);
    throw error;
  }
}

private transformCustomerRowWithDM(row: any): Customer {
  const customer = this.transformCustomerRow(row);
  
  // Add primary data manager info
  if (row.data_managers) {
    customer.primaryDataManager = {
      name: row.data_managers.name,
      email: row.data_managers.email
    };
  }
  
  return customer;
}
```

### 5. API Routes
```typescript
// File: server/routes.ts (additions)
// [NOT IMPLEMENTED]
import { authService } from './lib/auth/authService.js';
import { authMiddleware, optionalAuthMiddleware } from './lib/auth/middleware.js';
import { dataManagerService } from './lib/database/dataManagerService.js';

// Authentication routes
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const result = await authService.login(email, password);
    if (!result) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Set session cookie
    res.cookie('sessionToken', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({ dataManager: result.dataManager });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

app.post("/api/auth/logout", authMiddleware, async (req, res) => {
  try {
    const sessionToken = req.cookies?.sessionToken;
    if (sessionToken) {
      await authService.logout(sessionToken);
    }
    
    res.clearCookie('sessionToken');
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Logout failed" });
  }
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  res.json({ dataManager: req.currentDataManager });
});

// Customer assignment routes
app.post("/api/customers/:id/assign-dm", authMiddleware, async (req, res) => {
  try {
    const customerId = req.params.id;
    const { dataManagerId, isPrimary, notes } = req.body;
    
    await dataManagerService.assignCustomer(
      customerId, 
      dataManagerId, 
      isPrimary,
      req.currentDataManager?.id,
      notes
    );
    
    res.json({ message: "Data manager assigned successfully" });
  } catch (error) {
    console.error("Error assigning data manager:", error);
    res.status(500).json({ message: "Failed to assign data manager" });
  }
});

app.delete("/api/customers/:id/assign-dm/:dmId", authMiddleware, async (req, res) => {
  try {
    const { id: customerId, dmId } = req.params;
    
    await dataManagerService.unassignCustomer(customerId, dmId);
    
    res.json({ message: "Data manager unassigned successfully" });
  } catch (error) {
    console.error("Error unassigning data manager:", error);
    res.status(500).json({ message: "Failed to unassign data manager" });
  }
});

// Update existing customers route to support filtering
app.get("/api/customers", optionalAuthMiddleware, async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const myCustomersOnly = req.query.myCustomersOnly === 'true';
    
    const dataManagerId = myCustomersOnly ? req.currentDataManager?.id : undefined;
    
    const customers = await storage.getAllCustomersForDM(dataManagerId, includeInactive);
    res.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ message: "Failed to fetch customers" });
  }
});
```

## Frontend Implementation

> **Note:** The following frontend contexts and components **are not implemented** in the current codebase. They represent a planned design.

### 1. Authentication Context
```typescript
// File: client/src/contexts/AuthContext.tsx
// [NOT IMPLEMENTED]
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DataManager {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

interface AuthContextType {
  dataManager: DataManager | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [dataManager, setDataManager] = useState<DataManager | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setDataManager(data.dataManager);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setDataManager(data.dataManager);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setDataManager(null);
    }
  };

  return (
    <AuthContext.Provider value={{ dataManager, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 2. Login Component
```typescript
// File: client/src/components/Login.tsx
// [NOT IMPLEMENTED]
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const success = await login(email, password);
    
    if (!success) {
      setError('Invalid email or password');
    }
    
    setIsLoading(false);
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-neutral-50">
      <Card class="w-full max-w-md">
        <CardHeader class="text-center">
          <div class="flex justify-center mb-4">
            <div class="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Building class="text-white" size={24} />
            </div>
          </div>
          <CardTitle class="text-2xl">Sales Dashboard</CardTitle>
          <p class="text-neutral-600">Sign in to your account</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} class="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div class="flex items-center space-x-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <Button 
              type="submit" 
              class="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          
          <div class="mt-6 text-center text-sm text-neutral-600">
            <p>Demo Accounts:</p>
            <p>alice.johnson@company.com</p>
            <p>bob.smith@company.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 3. Protected Route Component
```typescript
// File: client/src/components/ProtectedRoute.tsx
// [NOT IMPLEMENTED]
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Login from './Login';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { dataManager, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div class="min-h-screen flex items-center justify-center">
        <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!dataManager) {
    return <Login />;
  }

  return <>{children}</>;
}
```

### 4. Updated Navigation with User Info
```typescript
// File: client/src/components/Navigation.tsx (updates)
// [NOT IMPLEMENTED]
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User } from 'lucide-react';

// Add to existing Navigation component:
const { dataManager, logout } = useAuth();

// Add user section to navigation:
<div class="flex items-center space-x-3">
  <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
    <User class="text-white" size={16} />
  </div>
  <div class="hidden md:block">
    <span class="text-sm font-medium text-neutral-700">
      {dataManager?.name}
    </span>
    <div class="text-xs text-neutral-500">
      {dataManager?.email}
    </div>
  </div>
  <Button 
    variant="ghost" 
    size="sm"
    onClick={logout}
    class="p-2"
  >
    <LogOut size={16} />
  </Button>
</div>
```

### 5. Customer Filter Component
```typescript
// File: client/src/components/CustomerFilter.tsx
// [NOT IMPLEMENTED]
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck } from 'lucide-react';

interface CustomerFilterProps {
  showMyCustomersOnly: boolean;
  onFilterChange: (myCustomersOnly: boolean) => void;
  myCustomersCount: number;
  totalCustomersCount: number;
}

export default function CustomerFilter({
  showMyCustomersOnly,
  onFilterChange,
  myCustomersCount,
  totalCustomersCount
}: CustomerFilterProps) {
  return (
    <div class="flex items-center space-x-2">
      <Button
        variant={showMyCustomersOnly ? "default" : "outline"}
        size="sm"
        onClick={() => onFilterChange(true)}
        class="flex items-center space-x-2"
      >
        <UserCheck size={16} />
        <span>My Customers</span>
        <Badge variant="secondary">{myCustomersCount}</Badge>
      </Button>
      
      <Button
        variant={!showMyCustomersOnly ? "default" : "outline"}
        size="sm"
        onClick={() => onFilterChange(false)}
        class="flex items-center space-x-2"
      >
        <Users size={16} />
        <span>All Customers</span>
        <Badge variant="secondary">{totalCustomersCount}</Badge>
      </Button>
    </div>
  );
}
```

## Configuration Management

> **Note:** The following configuration management setup **is not implemented** in the current codebase. It represents a planned design.

### Environment Configuration
```typescript
// File: server/lib/config/envConfig.ts
// [NOT IMPLEMENTED]
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().transform(Number).default(3000),
  DATABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters'),
  BCRYPT_ROUNDS: z.string().transform(Number).min(10).max(15).default(12),
  SESSION_DURATION_HOURS: z.string().transform(Number).default(24),
  ENABLE_SESSION_CLEANUP: z.string().transform(Boolean).default(true),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  METRICS_ENABLED: z.string().transform(Boolean).default(true),
  CORS_ORIGIN: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

class ConfigService {
  private config: EnvConfig;

  constructor() {
    try {
      this.config = envSchema.parse(process.env);
    } catch (error) {
      console.error('Environment validation failed:', error);
      process.exit(1);
    }
  }

  get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    return this.config[key];
  }

  getAll(): EnvConfig {
    return { ...this.config };
  }

  isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  validateSecrets(): void {
    const requiredSecrets = ['SESSION_SECRET', 'SUPABASE_ANON_KEY'];
    const missing = requiredSecrets.filter(secret => !process.env[secret]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required secrets: ${missing.join(', ')}`);
    }

    // Validate session secret strength
    const sessionSecret = this.config.SESSION_SECRET;
    if (sessionSecret.length < 32) {
      throw new Error('SESSION_SECRET must be at least 32 characters');
    }

    // Warn about weak secrets in production
    if (this.isProduction()) {
      const commonWeakSecrets = ['your-secret-key', 'development-secret', 'change-me'];
      if (commonWeakSecrets.some(weak => sessionSecret.includes(weak))) {
        throw new Error('Production SESSION_SECRET appears to be a default/weak value');
      }
    }
  }
}

export const configService = new ConfigService();

// Environment setup validation
export function validateEnvironment(): void {
  configService.validateSecrets();
  
  console.log(`Environment: ${configService.get('NODE_ENV')}`);
  console.log(`Port: ${configService.get('PORT')}`);
  console.log(`Session Duration: ${configService.get('SESSION_DURATION_HOURS')} hours`);
  console.log(`BCrypt Rounds: ${configService.get('BCRYPT_ROUNDS')}`);
}
```

### Secrets Rotation Strategy
```bash
#!/bin/bash
# File: scripts/rotate-session-secret.sh
# [NOT IMPLEMENTED] Script to rotate session secret in production

set -e

# Generate new secure session secret
NEW_SECRET=$(openssl rand -base64 48)

# Update environment
echo "Rotating session secret..."
echo "SESSION_SECRET=$NEW_SECRET" >> .env.new

# Validate new configuration
if npm run validate-env -- --env-file=.env.new; then
  mv .env.new .env
  echo "Session secret rotated successfully"
  echo "Restart the application to apply changes"
else
  rm .env.new
  echo "Failed to validate new configuration"
  exit 1
fi
```

### CI/CD Environment Validation
```yaml
# File: .github/workflows/env-validation.yml
# [NOT IMPLEMENTED]
name: Environment Validation
on: [push, pull_request]

jobs:
  validate-env:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - name: Validate Environment Schema
        run: npm run validate-env
        env:
          SESSION_SECRET: ${{ secrets.SESSION_SECRET }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

## Security Hardening

> **Note:** The following security hardening measures **are not implemented** in the current codebase. They represent a planned design.

### CSRF Protection Middleware
```typescript
// File: server/lib/security/csrfMiddleware.ts
// [NOT IMPLEMENTED]
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

interface CSRFRequest extends Request {
  csrfToken?: string;
}

export class CSRFProtection {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  generateToken(sessionId: string): string {
    const timestamp = Date.now().toString();
    const data = `${sessionId}:${timestamp}`;
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(data)
      .digest('hex');
    
    return Buffer.from(`${data}:${signature}`).toString('base64');
  }

  validateToken(token: string, sessionId: string): boolean {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf8');
      const [receivedSessionId, timestamp, signature] = decoded.split(':');
      
      // Verify session ID matches
      if (receivedSessionId !== sessionId) return false;
      
      // Verify token is not too old (1 hour max)
      const tokenAge = Date.now() - parseInt(timestamp);
      if (tokenAge > 60 * 60 * 1000) return false;
      
      // Verify signature
      const data = `${receivedSessionId}:${timestamp}`;
      const expectedSignature = crypto
        .createHmac('sha256', this.secret)
        .update(data)
        .digest('hex');
      
      return signature === expectedSignature;
    } catch {
      return false;
    }
  }

  middleware() {
    return (req: CSRFRequest, res: Response, next: NextFunction) => {
      // Skip CSRF for GET, HEAD, OPTIONS
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }

      const sessionId = req.session?.id || req.cookies?.sessionToken;
      if (!sessionId) {
        return res.status(401).json({ message: 'Session required' });
      }

      const csrfToken = req.headers['x-csrf-token'] as string || req.body._csrf;
      if (!csrfToken || !this.validateToken(csrfToken, sessionId)) {
        return res.status(403).json({ message: 'Invalid CSRF token' });
      }

      req.csrfToken = csrfToken;
      next();
    };
  }

  tokenGenerator() {
    return (req: CSRFRequest, res: Response, next: NextFunction) => {
      const sessionId = req.session?.id || req.cookies?.sessionToken;
      if (sessionId) {
        res.locals.csrfToken = this.generateToken(sessionId);
      }
      next();
    };
  }
}

export const csrfProtection = new CSRFProtection(process.env.SESSION_SECRET!);
```

### Security Headers Middleware
```typescript
// File: server/lib/security/securityHeaders.ts
// [NOT IMPLEMENTED]
import { Request, Response, NextFunction } from 'express';

export function securityHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Content Security Policy
    res.setHeader('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'"
    ].join('; '));

    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // HTTPS enforcement in production
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
  };
}
```

### Enhanced Cookie Security
```typescript
// File: server/lib/auth/cookieConfig.ts
// [NOT IMPLEMENTED]
export const cookieConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined,
  path: '/'
};

// Updated login endpoint with enhanced security
app.post("/api/auth/login", csrfProtection.middleware(), async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const result = await authService.login(email, password);
    if (!result) {
      // Add delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 1000));
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Set secure session cookie
    res.cookie('sessionToken', result.sessionToken, cookieConfig);
    
    // Set CSRF token
    res.cookie('csrfToken', csrfProtection.generateToken(result.sessionToken), {
      ...cookieConfig,
      httpOnly: false // CSRF token needs to be readable by JS
    });

    res.json({ 
      dataManager: result.dataManager,
      csrfToken: res.locals.csrfToken 
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});
```

## Concurrency Control

> **Note:** The following concurrency control measures **are not implemented** in the current codebase. They represent a planned design.

### Transaction-Safe Assignment Service
```typescript
// File: server/lib/database/concurrencySafeDataManagerService.ts
// [NOT IMPLEMENTED]
import { supabase } from '../supabase.js';

export class ConcurrencySafeDataManagerService {
  async assignCustomerSafely(
    customerId: string, 
    dataManagerId: string, 
    isPrimary: boolean = false,
    assignedBy?: string,
    notes?: string
  ): Promise<void> {
    // Use database transaction with explicit locking
    const { error } = await supabase.rpc('assign_customer_with_lock', {
      p_customer_id: customerId,
      p_data_manager_id: dataManagerId,
      p_is_primary: isPrimary,
      p_assigned_by: assignedBy,
      p_notes: notes
    });

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Assignment conflict - please retry');
      }
      throw error;
    }
  }

  async assignCustomerWithOptimisticLocking(
    customerId: string, 
    dataManagerId: string, 
    isPrimary: boolean = false,
    assignedBy?: string,
    notes?: string,
    maxRetries: number = 3
  ): Promise<void> {
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        // Start transaction
        const { data: currentData, error: fetchError } = await supabase
          .from('customer_data_managers')
          .select('version')
          .eq('customer_id', customerId)
          .eq('data_manager_id', dataManagerId)
          .maybeSingle();

        if (fetchError) throw fetchError;

        const currentVersion = currentData?.version || 0;
        const nextVersion = currentVersion + 1;

        if (isPrimary) {
          // Clear existing primary assignments in the same transaction
          const { error: clearError } = await supabase
            .from('customer_data_managers')
            .update({ is_primary: false, version: supabase.rpc('increment', { x: 1 }) })
            .eq('customer_id', customerId)
            .eq('is_primary', true);

          if (clearError) throw clearError;
        }

        // Upsert with version check
        const { error: upsertError } = await supabase
          .from('customer_data_managers')
          .upsert({
            customer_id: customerId,
            data_manager_id: dataManagerId,
            is_primary: isPrimary,
            assigned_by: assignedBy,
            notes: notes,
            version: nextVersion
          }, {
            onConflict: 'customer_id,data_manager_id',
            ignoreDuplicates: false
          });

        if (upsertError) throw upsertError;

        // Update customer's primary manager if applicable
        if (isPrimary) {
          const { error: customerError } = await supabase
            .from('customers')
            .update({ primary_manager_id: dataManagerId })
            .eq('id', customerId);

          if (customerError) throw customerError;
        }

        return; // Success, exit retry loop
        
      } catch (error: any) {
        attempt++;
        
        if (error.code === '23505' && attempt < maxRetries) {
          // Unique constraint violation - retry with exponential backoff
          const delay = Math.pow(2, attempt) * 100; // 200ms, 400ms, 800ms
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw error;
      }
    }
    
    throw new Error(`Assignment failed after ${maxRetries} attempts due to concurrency conflicts`);
  }
}

export const concurrencySafeDataManagerService = new ConcurrencySafeDataManagerService();
```

### Database Function for Atomic Operations
```sql
-- File: server/database/functions/assign_customer_with_lock.sql
-- [NOT IMPLEMENTED]
CREATE OR REPLACE FUNCTION assign_customer_with_lock(
  p_customer_id UUID,
  p_data_manager_id UUID,
  p_is_primary BOOLEAN DEFAULT FALSE,
  p_assigned_by UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Lock the customer row to prevent concurrent modifications
  PERFORM 1 FROM customers 
  WHERE id = p_customer_id 
  FOR UPDATE;

  -- If setting as primary, clear existing primary assignments
  IF p_is_primary THEN
    UPDATE customer_data_managers 
    SET is_primary = FALSE,
        version = version + 1
    WHERE customer_id = p_customer_id 
    AND is_primary = TRUE 
    AND data_manager_id != p_data_manager_id;
    
    -- Update customer's primary manager
    UPDATE customers 
    SET primary_manager_id = p_data_manager_id 
    WHERE id = p_customer_id;
  END IF;

  -- Insert or update the assignment
  INSERT INTO customer_data_managers (
    customer_id, data_manager_id, is_primary, assigned_by, notes, version
  ) VALUES (
    p_customer_id, p_data_manager_id, p_is_primary, p_assigned_by, p_notes, 1
  )
  ON CONFLICT (customer_id, data_manager_id) 
  DO UPDATE SET 
    is_primary = EXCLUDED.is_primary,
    assigned_by = EXCLUDED.assigned_by,
    notes = EXCLUDED.notes,
    version = customer_data_managers.version + 1,
    assigned_at = NOW();

EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Concurrent assignment conflict detected. Please retry.';
END;
$$;
```

## Observability & Monitoring

> **Note:** The following observability and monitoring tools **are not implemented** in the current codebase. They represent a planned design.

### Structured Logging
```typescript
// File: server/lib/logging/logger.ts
// [NOT IMPLEMENTED]
import winston from 'winston';
import { configService } from '../config/envConfig.js';

interface LogContext {
  userId?: string;
  customerId?: string;
  requestId?: string;
  operation?: string;
  duration?: number;
  [key: string]: any;
}

class Logger {
  private winston: winston.Logger;

  constructor() {
    this.winston = winston.createLogger({
      level: configService.get('LOG_LEVEL'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: {
        service: 'sales-dashboard',
        environment: configService.get('NODE_ENV')
      },
      transports: [
        new winston.transports.Console({
          format: configService.isDevelopment() 
            ? winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
              )
            : winston.format.json()
        }),
        ...(configService.isProduction() ? [
          new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error' 
          }),
          new winston.transports.File({ 
            filename: 'logs/combined.log' 
          })
        ] : [])
      ]
    });
  }

  private formatMessage(message: string, context?: LogContext): any {
    return {
      message,
      ...context,
      timestamp: new Date().toISOString()
    };
  }

  info(message: string, context?: LogContext): void {
    this.winston.info(this.formatMessage(message, context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.winston.error(this.formatMessage(message, {
      ...context,
      error: error?.message,
      stack: error?.stack
    }));
  }

  warn(message: string, context?: LogContext): void {
    this.winston.warn(this.formatMessage(message, context));
  }

  debug(message: string, context?: LogContext): void {
    this.winston.debug(this.formatMessage(message, context));
  }

  // Authentication specific logging
  logAuthEvent(event: 'login' | 'logout' | 'failed_login', userId?: string, context?: LogContext): void {
    this.info(`Authentication event: ${event}`, {
      ...context,
      userId,
      event_type: 'auth',
      event
    });
  }

  // Customer assignment logging
  logCustomerAssignment(
    action: 'assigned' | 'unassigned' | 'primary_changed',
    customerId: string,
    dataManagerId: string,
    context?: LogContext
  ): void {
    this.info(`Customer assignment: ${action}`, {
      ...context,
      customerId,
      dataManagerId,
      event_type: 'customer_assignment',
      action
    });
  }

  // Performance logging
  logPerformance(operation: string, duration: number, context?: LogContext): void {
    this.info(`Performance metric`, {
      ...context,
      operation,
      duration,
      event_type: 'performance'
    });
  }
}

export const logger = new Logger();

// Request logging middleware
export function requestLogger() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    const requestId = crypto.randomUUID();
    
    req.requestId = requestId;
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info('HTTP Request', {
        requestId,
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    });
    
    next();
  };
}
```

### Metrics Collection
```typescript
// File: server/lib/monitoring/metrics.ts
// [NOT IMPLEMENTED]
interface MetricData {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: Date;
}

class MetricsCollector {
  private metrics: MetricData[] = [];
  private enabled: boolean;

  constructor() {
    this.enabled = configService.get('METRICS_ENABLED');
  }

  counter(name: string, value: number = 1, tags?: Record<string, string>): void {
    if (!this.enabled) return;
    
    this.metrics.push({
      name: `counter.${name}`,
      value,
      tags,
      timestamp: new Date()
    });
  }

  histogram(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.enabled) return;
    
    this.metrics.push({
      name: `histogram.${name}`,
      value,
      tags,
      timestamp: new Date()
    });
  }

  gauge(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.enabled) return;
    
    this.metrics.push({
      name: `gauge.${name}`,
      value,
      tags,
      timestamp: new Date()
    });
  }

  // Authentication metrics
  authLogin(success: boolean, provider: string = 'local'): void {
    this.counter('auth.login', 1, { success: success.toString(), provider });
  }

  authSession(action: 'created' | 'validated' | 'expired'): void {
    this.counter('auth.session', 1, { action });
  }

  // Customer metrics
  customerAssignment(action: 'assigned' | 'unassigned'): void {
    this.counter('customer.assignment', 1, { action });
  }

  customerFiltered(filter: 'my_customers' | 'all_customers', count: number): void {
    this.histogram('customer.filtered', count, { filter });
  }

  // Performance metrics
  httpRequest(method: string, path: string, status: number, duration: number): void {
    this.histogram('http.request.duration', duration, { 
      method, 
      path: this.sanitizePath(path), 
      status: status.toString() 
    });
    this.counter('http.request.count', 1, { 
      method, 
      path: this.sanitizePath(path), 
      status: status.toString() 
    });
  }

  databaseQuery(operation: string, table: string, duration: number): void {
    this.histogram('database.query.duration', duration, { operation, table });
    this.counter('database.query.count', 1, { operation, table });
  }

  private sanitizePath(path: string): string {
    // Replace IDs with placeholders for better grouping
    return path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/\d+/g, '/:id');
  }

  // Export metrics for external monitoring systems
  getMetrics(): MetricData[] {
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  // Send metrics to external service (Datadog, Grafana, etc.)
  async flushMetrics(): Promise<void> {
    if (!this.enabled || this.metrics.length === 0) return;

    try {
      // Example: Send to Datadog
      if (process.env.DATADOG_API_KEY) {
        await this.sendToDatadog(this.metrics);
      }
      
      // Example: Send to custom metrics endpoint
      if (process.env.METRICS_ENDPOINT) {
        await this.sendToCustomEndpoint(this.metrics);
      }
      
      logger.debug('Metrics flushed', { count: this.metrics.length });
      this.clearMetrics();
    } catch (error) {
      logger.error('Failed to flush metrics', error as Error);
    }
  }

  private async sendToDatadog(metrics: MetricData[]): Promise<void> {
    // Implementation for Datadog metrics API
    const payload = {
      series: metrics.map(metric => ({
        metric: `sales_dashboard.${metric.name}`,
        points: [[Math.floor(metric.timestamp!.getTime() / 1000), metric.value]],
        tags: metric.tags ? Object.entries(metric.tags).map(([k, v]) => `${k}:${v}`) : []
      }))
    };

    // Send to Datadog API
    // Implementation details depend on your monitoring setup
  }

  private async sendToCustomEndpoint(metrics: MetricData[]): Promise<void> {
    // Send to your custom metrics collection endpoint
    await fetch(process.env.METRICS_ENDPOINT!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrics })
    });
  }
}

export const metrics = new MetricsCollector();

// Middleware to collect HTTP metrics
export function metricsMiddleware() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      metrics.httpRequest(req.method, req.path, res.statusCode, duration);
    });
    
    next();
  };
}

// Periodic metrics flush
setInterval(() => {
  metrics.flushMetrics();
}, 60000); // Flush every minute
```

### Health Checks
```typescript
// File: server/lib/monitoring/healthCheck.ts
// [NOT IMPLEMENTED]
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  checks: Record<string, {
    status: 'pass' | 'fail' | 'warn';
    message?: string;
    duration?: number;
  }>;
  timestamp: string;
}

export class HealthChecker {
  async performHealthCheck(): Promise<HealthCheckResult> {
    const checks: HealthCheckResult['checks'] = {};
    const start = Date.now();

    // Database connectivity
    try {
      const dbStart = Date.now();
      const { error } = await supabase.from('data_managers').select('count').limit(1);
      checks.database = {
        status: error ? 'fail' : 'pass',
        message: error?.message,
        duration: Date.now() - dbStart
      };
    } catch (error) {
      checks.database = {
        status: 'fail',
        message: 'Database connection failed'
      };
    }

    // Session cleanup
    try {
      const sessionStart = Date.now();
      await authService.cleanupExpiredSessions();
      checks.session_cleanup = {
        status: 'pass',
        duration: Date.now() - sessionStart
      };
    } catch (error) {
      checks.session_cleanup = {
        status: 'warn',
        message: 'Session cleanup failed'
      };
    }

    // Memory usage
    const memUsage = process.memoryUsage();
    const memUsageMB = memUsage.heapUsed / 1024 / 1024;
    checks.memory = {
      status: memUsageMB > 500 ? 'warn' : 'pass',
      message: `${memUsageMB.toFixed(2)} MB heap used`
    };

    // Determine overall status
    const hasFailures = Object.values(checks).some(c => c.status === 'fail');
    const hasWarnings = Object.values(checks).some(c => c.status === 'warn');
    
    const status = hasFailures ? 'unhealthy' : (hasWarnings ? 'degraded' : 'healthy');

    return {
      status,
      checks,
      timestamp: new Date().toISOString()
    };
  }
}

export const healthChecker = new HealthChecker();

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const result = await healthChecker.performHealthCheck();
    const statusCode = result.status === 'healthy' ? 200 : 
                      result.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(result);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      checks: {
        general: {
          status: 'fail',
          message: 'Health check failed'
        }
      },
      timestamp: new Date().toISOString()
    });
  }
});
```

## Accessibility Standards

> **Note:** The following accessibility standards **are not implemented** in the current codebase. They represent a planned design.

### Accessible Login Component
```typescript
// File: client/src/components/AccessibleLogin.tsx
// [NOT IMPLEMENTED]
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function AccessibleLogin() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const success = await login(email, password);
    
    if (!success) {
      setError('Invalid email or password');
    }
    
    setIsLoading(false);
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-neutral-50">
      <Card class="w-full max-w-md">
        <CardHeader class="text-center">
          <div class="flex justify-center mb-4">
            <div class="w-12 h-12 bg-primary rounded-lg flex items-center justify-center" aria-hidden="true">
              <Building class="text-white" size={24} />
            </div>
          </div>
          <CardTitle class="text-2xl">Sales Dashboard</CardTitle>
          <p class="text-neutral-600">Sign in to your account</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} class="space-y-4" noValidate>
            {error && (
              <div 
                ref={errorRef}
                tabIndex={-1}
                role="alert"
                aria-live="assertive"
                class="flex items-center space-x-2 text-red-600 text-sm p-2 bg-red-50 rounded-md"
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                ref={emailRef}
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                autoComplete="email"
                aria-describedby="email-error"
              />
              {/* Add error message display here */}
            </div>
            
            <div class="relative">
              <Label htmlFor="password">Password</Label>
              <Input
                ref={passwordRef}
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                aria-describedby="password-error"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                class="absolute right-1 top-1/2"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
              {/* Add error message display here */}
            </div>

            <Button 
              type="submit" 
              class="w-full" 
              disabled={isLoading}
              aria-live="polite"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Testing Strategy

> **Note:** The following testing strategies **are not implemented** in the current codebase. They represent a planned design.

### Unit Tests
```typescript
// File: server/lib/auth/authService.test.ts
// [NOT IMPLEMENTED]
import { AuthService } from './authService';
import { supabase } from '../supabase';
import bcrypt from 'bcrypt';

jest.mock('../supabase');
jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  it('should successfully log in a valid user', async () => {
    // Mock Supabase response
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: '1', password_hash: 'hashed_password' },
        error: null
      }),
      insert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn().mockResolvedValue({ error: null })
    });

    // Mock bcrypt
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await authService.login('test@test.com', 'password');
    expect(result).not.toBeNull();
    expect(result?.sessionToken).toBeDefined();
  });

  it('should fail to log in with an invalid password', async () => {
    // Mock Supabase response
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: '1', password_hash: 'hashed_password' },
        error: null
      })
    });

    // Mock bcrypt
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const result = await authService.login('test@test.com', 'wrong_password');
    expect(result).toBeNull();
  });
});
```

### Integration Tests
```typescript
// File: tests/integration/auth.test.ts
// [NOT IMPLEMENTED]
import request from 'supertest';
import { app } from '../../server/index'; // Assuming app is exported

describe('Authentication API', () => {
  it('POST /api/auth/login should return a session token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice.johnson@company.com', password: 'correct_password' });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('dataManager');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('GET /api/auth/me should return user info with a valid token', async () => {
    // First, log in to get a token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice.johnson@company.com', password: 'correct_password' });
    
    const token = loginRes.headers['set-cookie'][0].split(';')[0].split('=')[1];

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `sessionToken=${token}`);
      
    expect(res.statusCode).toEqual(200);
    expect(res.body.dataManager.email).toEqual('alice.johnson@company.com');
  });
});
```

### End-to-End (E2E) Tests
```javascript
// File: tests/e2e/login.spec.js
// [NOT IMPLEMENTED]
const { test, expect } = require('@playwright/test');

test.describe('Login Flow', () => {
  test('should allow a user to log in and see the dashboard', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'alice.johnson@company.com');
    await page.fill('input[name="password"]', 'correct_password');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome, Alice')).toBeVisible();
  });

  test('should show an error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'alice.johnson@company.com');
    await page.fill('input[name="password"]', 'wrong_password');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });
});
```

## Deployment Guide

> **Note:** The following deployment steps **are not fully applicable** as the authentication system is not implemented. Refer to the main `README.md` for current deployment instructions.

### Pre-deployment Checklist
1.  [ ] Environment variables configured for production (`SESSION_SECRET`, `DATABASE_URL`, etc.)
2.  [ ] Database migrations run successfully
3.  [ ] All tests passing in CI/CD pipeline
4.  [ ] Production build generated (`npm run build`)
5.  [ ] Logging levels set to `info` or `warn`
6.  [ ] Session cleanup cron job configured

### Deployment Steps
1.  **Build Application**: `npm run build`
2.  **Deploy to Server**: Copy `dist/`, `node_modules/`, `package.json` to production server
3.  **Run Migrations**: `npm run db:migrate`
4.  **Start Server**: `npm start` (using a process manager like PM2 is recommended)

### PM2 Configuration
```javascript
// File: ecosystem.config.js
module.exports = {
  apps: [{
    name: 'sales-dashboard',
    script: 'dist/server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
```

## Maintenance & Troubleshooting

### Common Issues
- **Invalid Session**: Clear cookies and log in again. Check `dm_sessions` table for expired tokens.
- **CSRF Token Mismatch**: Ensure frontend is sending `X-CSRF-Token` header on all state-changing requests.
- **Concurrency Conflicts**: Retry the operation. If it persists, check for long-running transactions locking rows.

### Log Rotation
- Use a tool like `logrotate` to manage log file sizes.
- Example `logrotate` config:
  ```
  /path/to/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 640 root adm
  }
  ```

### Database Backups
- Use Supabase's built-in backup tools or a custom `pg_dump` script.
- Schedule daily backups and store them in a secure, off-site location.
