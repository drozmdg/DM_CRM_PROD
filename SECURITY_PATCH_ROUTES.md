# Security Patch - Route Protection Implementation

**Date:** July 15, 2025  
**Priority:** CRITICAL  
**Status:** Ready for Implementation  

---

## 🎯 Overview

This document provides the systematic approach to apply authentication protection to all API routes in the application. Based on the code review findings, authentication needs to be consistently applied across all endpoints.

---

## 📋 Route Protection Strategy

### **Public Routes (No Authentication Required)**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/reset-password` - Password reset
- `GET /health` - Health check (if exists)

### **Protected Routes (Authentication Required)**
All other routes should require authentication using `requireAuth` middleware.

### **Admin-Only Routes (Admin Role Required)**
- `GET /api/auth/users` - List all users
- `PUT /api/auth/users/:id` - Update user profile (admin)
- `DELETE /api/auth/users/:id` - Delete user
- `DELETE /api/customers/:id` - Delete customer
- `DELETE /api/processes/:id` - Delete process

### **Manager+ Routes (Manager or Admin Role Required)**
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `POST /api/processes` - Create process
- `PUT /api/processes/:id` - Update process
- `POST /api/contacts` - Create contact
- `PUT /api/contacts/:id` - Update contact

---

## 🔧 Implementation Pattern

### **Step 1: Update Route Definitions**

Replace:
```typescript
app.get("/api/customers", async (req, res) => {
```

With:
```typescript
app.get("/api/customers", requireAuth, async (req, res) => {
```

### **Step 2: Apply Role-Based Protection**

For admin-only operations:
```typescript
app.delete("/api/customers/:id", requireAdmin, async (req, res) => {
```

For manager+ operations:
```typescript
app.post("/api/customers", requireManagerOrAdmin, async (req, res) => {
```

---

## 📝 Complete Route Protection List

Copy and apply these changes to `/server/routes.ts`:

```typescript
// Dashboard routes
app.get("/api/dashboard/metrics", requireAuth, async (req, res) => {
app.get("/api/dashboard/metrics-legacy", requireAuth, async (req, res) => {

// Customer routes
app.get("/api/customers", requireAuth, async (req, res) => {
app.get("/api/customers/:id", requireAuth, async (req, res) => {
app.post("/api/customers", requireManagerOrAdmin, async (req, res) => {
app.put("/api/customers/:id", requireManagerOrAdmin, async (req, res) => {
app.delete("/api/customers/:id", requireAdmin, async (req, res) => {
app.get("/api/customers/:id/report-data", requireAuth, async (req, res) => {
app.post("/api/customers/:id/export-pdf", requireAuth, async (req, res) => {

// Contact routes  
app.get("/api/contacts", requireAuth, async (req, res) => {
app.post("/api/contacts", requireManagerOrAdmin, async (req, res) => {
app.put("/api/contacts/:id", requireManagerOrAdmin, async (req, res) => {
app.delete("/api/contacts/:id", requireManagerOrAdmin, async (req, res) => {
app.get("/api/contacts/debug", requireAuth, async (req, res) => {
app.get("/api/contacts/internal", requireAuth, async (req, res) => {
app.get("/api/contacts/:contactId/assignments", requireAuth, async (req, res) => {
app.post("/api/contacts/:contactId/assign/:customerId", requireManagerOrAdmin, async (req, res) => {
app.delete("/api/contacts/:contactId/assign/:customerId", requireManagerOrAdmin, async (req, res) => {
app.get("/api/contacts/:id/communications", requireAuth, async (req, res) => {

// Communication routes
app.get("/api/communications", requireAuth, async (req, res) => {
app.post("/api/communications", requireManagerOrAdmin, async (req, res) => {
app.get("/api/communications/:id", requireAuth, async (req, res) => {
app.put("/api/communications/:id", requireManagerOrAdmin, async (req, res) => {
app.delete("/api/communications/:id", requireManagerOrAdmin, async (req, res) => {

// Customer notes routes
app.get("/api/customers/:customerId/notes", requireAuth, async (req, res) => {
app.post("/api/customers/:customerId/notes", requireManagerOrAdmin, async (req, res) => {
app.put("/api/customers/notes/:id", requireManagerOrAdmin, async (req, res) => {
app.delete("/api/customers/notes/:id", requireManagerOrAdmin, async (req, res) => {

// Important dates routes
app.get("/api/customers/:customerId/important-dates", requireAuth, async (req, res) => {
app.post("/api/customers/:customerId/important-dates", requireManagerOrAdmin, async (req, res) => {
app.put("/api/customers/important-dates/:id", requireManagerOrAdmin, async (req, res) => {
app.delete("/api/customers/important-dates/:id", requireManagerOrAdmin, async (req, res) => {
app.get("/api/important-dates/upcoming", requireAuth, async (req, res) => {

// Process routes
app.get("/api/processes", requireAuth, async (req, res) => {
app.post("/api/processes", requireManagerOrAdmin, async (req, res) => {
app.get("/api/processes/:id", requireAuth, async (req, res) => {
app.put("/api/processes/:id", requireManagerOrAdmin, async (req, res) => {
app.delete("/api/processes/:id", requireAdmin, async (req, res) => {

// Process task routes
app.get("/api/processes/:id/tasks", requireAuth, async (req, res) => {
app.post("/api/processes/:id/tasks", requireManagerOrAdmin, async (req, res) => {
app.get("/api/tasks/:id", requireAuth, async (req, res) => {
app.put("/api/tasks/:id", requireManagerOrAdmin, async (req, res) => {
app.delete("/api/tasks/:id", requireManagerOrAdmin, async (req, res) => {
app.get("/api/processes/:id/progress", requireAuth, async (req, res) => {

// Process team routes
app.get("/api/processes/:id/teams", requireAuth, async (req, res) => {
app.post("/api/processes/:id/teams/:teamId", requireManagerOrAdmin, async (req, res) => {
app.delete("/api/processes/:id/teams/:teamId", requireManagerOrAdmin, async (req, res) => {

// File transfer routes
app.get("/api/processes/:id/file-transfers", requireAuth, async (req, res) => {
app.post("/api/processes/:id/file-transfers", requireManagerOrAdmin, async (req, res) => {
app.get("/api/file-transfers/:id", requireAuth, async (req, res) => {
app.put("/api/file-transfers/:id", requireManagerOrAdmin, async (req, res) => {
app.delete("/api/file-transfers/:id", requireManagerOrAdmin, async (req, res) => {

// Notification routes
app.get("/api/processes/:id/notifications", requireAuth, async (req, res) => {
app.post("/api/processes/:id/notifications", requireManagerOrAdmin, async (req, res) => {
app.get("/api/notifications/:id", requireAuth, async (req, res) => {
app.put("/api/notifications/:id", requireManagerOrAdmin, async (req, res) => {
app.delete("/api/notifications/:id", requireManagerOrAdmin, async (req, res) => {
app.get("/api/notifications/events/types", requireAuth, async (req, res) => {

// Service routes
app.get("/api/services", requireAuth, async (req, res) => {
app.post("/api/services", requireManagerOrAdmin, async (req, res) => {
app.get("/api/services/:id", requireAuth, async (req, res) => {
app.put("/api/services/:id", requireManagerOrAdmin, async (req, res) => {
app.delete("/api/services/:id", requireAdmin, async (req, res) => {

// Team routes
app.get("/api/teams", requireAuth, async (req, res) => {
app.post("/api/teams", requireManagerOrAdmin, async (req, res) => {
app.get("/api/teams/:id", requireAuth, async (req, res) => {
app.put("/api/teams/:id", requireManagerOrAdmin, async (req, res) => {
app.delete("/api/teams/:id", requireAdmin, async (req, res) => {

// Product routes
app.get("/api/products", requireAuth, async (req, res) => {
app.post("/api/products", requireManagerOrAdmin, async (req, res) => {
app.get("/api/products/:id", requireAuth, async (req, res) => {
app.put("/api/products/:id", requireManagerOrAdmin, async (req, res) => {
app.delete("/api/products/:id", requireAdmin, async (req, res) => {
app.post("/api/products/:productId/assign-team", requireManagerOrAdmin, async (req, res) => {
app.delete("/api/products/:productId/unassign-team/:teamId", requireManagerOrAdmin, async (req, res) => {

// Document routes
app.get("/api/documents", requireAuth, async (req, res) => {
app.post("/api/documents", requireManagerOrAdmin, async (req, res) => {
app.get("/api/documents/:id", requireAuth, async (req, res) => {
app.delete("/api/documents/:id", requireManagerOrAdmin, async (req, res) => {

// Timeline routes
app.get("/api/timeline", requireAuth, async (req, res) => {
app.post("/api/timeline", requireManagerOrAdmin, async (req, res) => {
app.get("/api/process-timeline", requireAuth, async (req, res) => {
app.post("/api/process-timeline", requireManagerOrAdmin, async (req, res) => {

// AI Chat routes
app.get("/api/ai-chat/sessions", requireAuth, async (req, res) => {
app.post("/api/ai-chat/send", requireAuth, async (req, res) => {
```

---

## ⚡ Quick Implementation Script

Due to the extensive number of routes, here's a quick find-and-replace pattern:

1. **Find:** `app\.(get|post|put|delete)\("(/api/[^"]+)",\s*async\s*\(`
2. **Replace:** Based on the route type and operation

---

## 🔍 Verification Steps

After applying the changes:

1. **Check all routes have protection:**
   ```bash
   grep -n "app\.\(get\|post\|put\|delete\)" server/routes.ts | grep -v "require"
   ```
   Should return only auth routes and health checks.

2. **Test authentication:**
   - Try accessing `/api/customers` without token (should return 401)
   - Try accessing with valid token (should work)
   - Try admin operations with non-admin user (should return 403)

3. **Run the application:**
   ```bash
   npm run dev
   ```
   Should start without errors.

---

## 📊 Impact Assessment

- **Routes Protected:** ~50+ API endpoints
- **Security Level:** High - All routes now require authentication
- **Breaking Changes:** Yes - Frontend will need to send auth tokens
- **Performance Impact:** Minimal - Authentication check is fast

---

**PRIORITY:** Apply this patch immediately after the user completes the Supabase setup tasks.