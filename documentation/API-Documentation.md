# DM_CRM Sales Dashboard - API Documentation

**Document Version:** 1.0  
**Date:** July 17, 2025  
**API Version:** Production Ready  
**Base URL:** `http://localhost:3000/api`  
**Authentication:** JWT Bearer Token Required (except where noted)  

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Dashboard Metrics](#dashboard-metrics)
3. [Customer Management](#customer-management)
4. [Contact Management](#contact-management)
5. [Communication Management](#communication-management)
6. [Process Management](#process-management)
7. [Task Management](#task-management)
8. [Service Management](#service-management)
9. [Product Management](#product-management)
10. [Team Management](#team-management)
11. [Document Management](#document-management)
12. [File Transfer Management](#file-transfer-management)
13. [Notification Management](#notification-management)
14. [AI Chat System](#ai-chat-system)
15. [PDF Report Generation](#pdf-report-generation)
16. [Health Check](#health-check)

---

## 🔐 Authentication

All API endpoints require JWT authentication except where explicitly noted. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### **Authentication Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/register` | User registration | No |
| POST | `/api/auth/reset-password` | Password reset | No |
| POST | `/api/auth/refresh` | Refresh JWT token | No |
| GET | `/api/auth/me` | Get current user | Yes |

**Login Request:**
```json
{
  "email": "user@company.com",
  "password": "securepassword"
}
```

**Login Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "user@company.com",
    "role": "admin"
  }
}
```

---

## 📊 Dashboard Metrics

### **GET /api/dashboard/metrics**
Get dashboard metrics for the main dashboard view.

**Authentication:** Required  
**Parameters:** None  

**Response:**
```json
{
  "customers": {
    "total": 25,
    "active": 23,
    "inactive": 2
  },
  "processes": {
    "total": 15,
    "inProgress": 8,
    "completed": 5,
    "onHold": 2
  },
  "documents": {
    "total": 156,
    "recent": 12
  },
  "timeline": [
    {
      "date": "2025-07-15",
      "events": 8
    }
  ]
}
```

---

## 👥 Customer Management

### **GET /api/customers**
Retrieve all customers with optional filtering.

**Authentication:** Required  
**Query Parameters:**
- `includeInactive` (boolean): Include inactive customers

**Response:**
```json
[
  {
    "id": "cust_123",
    "name": "Acme Corporation",
    "industry": "Manufacturing",
    "email": "contact@acme.com",
    "phone": "+1-555-0123",
    "address": "123 Main St, City, State 12345",
    "active": true,
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-07-15T14:30:00Z"
  }
]
```

### **GET /api/customers/:id**
Get a specific customer by ID.

**Authentication:** Required  
**Path Parameters:**
- `id` (string): Customer ID

### **POST /api/customers**
Create a new customer.

**Authentication:** Required  
**Request Body:**
```json
{
  "name": "New Customer Inc",
  "industry": "Technology",
  "email": "info@newcustomer.com",
  "phone": "+1-555-0456",
  "address": "456 Tech Blvd, Innovation City, IC 67890",
  "contacts": [
    {
      "name": "John Smith",
      "email": "john@newcustomer.com",
      "phone": "+1-555-0457",
      "role": "Primary Contact"
    }
  ],
  "services": [
    {
      "name": "Consulting Services",
      "description": "Business consulting",
      "monthlyHours": 40
    }
  ]
}
```

### **PUT /api/customers/:id**
Update an existing customer.

**Authentication:** Required  
**Path Parameters:**
- `id` (string): Customer ID

### **DELETE /api/customers/:id**
Delete a customer.

**Authentication:** Required  
**Path Parameters:**
- `id` (string): Customer ID

### **Customer Notes**

#### **GET /api/customers/:customerId/notes**
Get all notes for a customer.

#### **POST /api/customers/:customerId/notes**
Create a new note for a customer.

**Request Body:**
```json
{
  "content": "Customer meeting notes...",
  "type": "meeting",
  "isImportant": false
}
```

#### **PUT /api/customers/notes/:id**
Update a customer note.

#### **DELETE /api/customers/notes/:id**
Delete a customer note.

### **Important Dates**

#### **GET /api/customers/:customerId/important-dates**
Get important dates for a customer.

#### **POST /api/customers/:customerId/important-dates**
Create an important date for a customer.

**Request Body:**
```json
{
  "title": "Contract Renewal",
  "date": "2025-12-31",
  "description": "Annual contract renewal date",
  "notifyDaysBefore": 30
}
```

#### **GET /api/important-dates/upcoming**
Get upcoming important dates across all customers.

---

## 📞 Contact Management

### **GET /api/contacts**
Retrieve all contacts with optional customer filtering.

**Query Parameters:**
- `customerId` (string): Filter by customer ID

**Response:**
```json
[
  {
    "id": "contact_123",
    "customerId": "cust_123",
    "name": "Jane Doe",
    "email": "jane@acme.com",
    "phone": "+1-555-0124",
    "role": "Project Manager",
    "isInternal": false,
    "isPrimary": true,
    "createdAt": "2025-01-15T10:00:00Z"
  }
]
```

### **POST /api/contacts**
Create a new contact.

**Request Body:**
```json
{
  "customerId": "cust_123",
  "name": "New Contact",
  "email": "contact@company.com",
  "phone": "+1-555-0789",
  "role": "Technical Lead",
  "isInternal": false,
  "isPrimary": false
}
```

### **PUT /api/contacts/:id**
Update a contact.

### **DELETE /api/contacts/:id**
Delete a contact.

### **Internal Contact Management**

#### **GET /api/contacts/internal**
Get all internal contacts.

#### **GET /api/contacts/:contactId/assignments**
Get customer assignments for a contact.

#### **POST /api/contacts/:contactId/assign/:customerId**
Assign a contact to a customer.

#### **DELETE /api/contacts/:contactId/assign/:customerId**
Remove contact assignment from a customer.

---

## 💬 Communication Management

### **GET /api/communications**
Get all communications with optional filtering.

**Query Parameters:**
- `contactId` (string): Filter by contact ID
- `type` (string): Filter by communication type

### **POST /api/communications**
Create a new communication record.

**Request Body:**
```json
{
  "contactId": "contact_123",
  "type": "email",
  "subject": "Project Update",
  "content": "Communication content...",
  "direction": "outbound",
  "communicatedAt": "2025-07-15T14:00:00Z"
}
```

### **GET /api/communications/:id**
Get a specific communication.

### **PUT /api/communications/:id**
Update a communication record.

### **DELETE /api/communications/:id**
Delete a communication record.

---

## 🔄 Process Management

### **GET /api/processes**
Retrieve all processes with optional filtering.

**Query Parameters:**
- `customerId` (string): Filter by customer ID
- `status` (string): Filter by process status

**Response:**
```json
[
  {
    "id": "proc_123",
    "customerId": "cust_123",
    "name": "System Implementation",
    "description": "Complete system implementation project",
    "status": "in_progress",
    "phase": "development",
    "startDate": "2025-01-01",
    "endDate": "2025-06-30",
    "progress": 65,
    "createdAt": "2024-12-15T09:00:00Z"
  }
]
```

### **GET /api/processes/:id**
Get a specific process by ID.

### **POST /api/processes**
Create a new process.

**Request Body:**
```json
{
  "customerId": "cust_123",
  "name": "New Process",
  "description": "Process description",
  "phase": "planning",
  "startDate": "2025-08-01",
  "endDate": "2025-12-31"
}
```

### **PUT /api/processes/:id**
Update a process.

### **Process Progress**

#### **GET /api/processes/progress/all**
Get progress for all processes.

#### **GET /api/processes/:processId/progress**
Get detailed progress for a specific process.

### **Process Milestones**

#### **GET /api/processes/:processId/milestones**
Get milestones for a process.

#### **POST /api/processes/:processId/milestones**
Create a new milestone for a process.

**Request Body:**
```json
{
  "name": "Phase 1 Complete",
  "description": "First phase milestone",
  "dueDate": "2025-09-30",
  "status": "pending"
}
```

#### **PUT /api/milestones/:id**
Update a milestone.

#### **DELETE /api/milestones/:id**
Delete a milestone.

---

## ✅ Task Management

### **GET /api/processes/:processId/tasks**
Get all tasks for a process.

**Response:**
```json
[
  {
    "id": "task_123",
    "processId": "proc_123",
    "name": "Database Setup",
    "description": "Set up production database",
    "status": "completed",
    "priority": "high",
    "assignedTo": "contact_456",
    "dueDate": "2025-07-20",
    "completedAt": "2025-07-18T16:00:00Z"
  }
]
```

### **POST /api/processes/:processId/tasks**
Create a new task for a process.

**Request Body:**
```json
{
  "name": "New Task",
  "description": "Task description",
  "priority": "medium",
  "assignedTo": "contact_123",
  "dueDate": "2025-08-15",
  "estimatedHours": 8
}
```

### **GET /api/tasks/:id**
Get a specific task.

### **PUT /api/tasks/:id**
Update a task.

### **DELETE /api/tasks/:id**
Delete a task.

### **POST /api/tasks/:id/subtasks**
Create a subtask for an existing task.

### **GET /api/tasks/upcoming**
Get upcoming tasks across all processes.

---

## 🛠️ Service Management

### **GET /api/services**
Get all services with optional customer filtering.

**Query Parameters:**
- `customerId` (string): Filter by customer ID

### **GET /api/services/:id**
Get a specific service.

### **POST /api/services**
Create a new service.

**Request Body:**
```json
{
  "customerId": "cust_123",
  "name": "Consulting Services",
  "description": "Business process consulting",
  "monthlyHours": 40,
  "rate": 150.00,
  "currency": "USD"
}
```

### **PUT /api/services/:id**
Update a service.

### **DELETE /api/services/:id**
Delete a service.

---

## 💊 Product Management

### **GET /api/products**
Get all pharmaceutical products.

**Query Parameters:**
- `teamId` (string): Filter by team ID

**Response:**
```json
[
  {
    "id": "prod_123",
    "name": "Product A",
    "description": "Pharmaceutical product description",
    "therapeuticArea": "Oncology",
    "developmentStage": "Phase II",
    "isActive": true,
    "teams": [
      {
        "id": "team_456",
        "name": "Development Team Alpha"
      }
    ]
  }
]
```

### **GET /api/products/:id**
Get a specific product.

### **POST /api/products**
Create a new product.

### **PUT /api/products/:id**
Update a product.

### **DELETE /api/products/:id**
Delete a product.

### **Product Team Management**

#### **POST /api/products/:productId/teams**
Assign a team to a product.

#### **DELETE /api/products/:productId/teams/:teamId**
Remove team assignment from a product.

#### **GET /api/teams/:teamId/products**
Get products assigned to a team.

### **Product Metrics**

#### **GET /api/products/metrics**
Get product development metrics.

#### **GET /api/products/team/:teamId**
Get products for a specific team.

---

## 👥 Team Management

### **GET /api/teams**
Get all teams.

**Response:**
```json
[
  {
    "id": "team_123",
    "name": "Development Team Alpha",
    "description": "Primary development team",
    "financeCode": "DEV-001",
    "isActive": true,
    "memberCount": 8,
    "createdAt": "2025-01-01T00:00:00Z"
  }
]
```

### **GET /api/teams/:id**
Get a specific team.

### **POST /api/teams**
Create a new team.

**Request Body:**
```json
{
  "name": "New Team",
  "description": "Team description",
  "financeCode": "TEAM-002",
  "isActive": true
}
```

### **PUT /api/teams/:id**
Update a team.

### **DELETE /api/teams/:id**
Delete a team.

### **Process Team Assignment**

#### **GET /api/processes/:processId/teams**
Get teams assigned to a process.

#### **POST /api/processes/:processId/teams/:teamId**
Assign a team to a process.

#### **DELETE /api/processes/:processId/teams/:teamId**
Remove team assignment from a process.

---

## 📄 Document Management

### **GET /api/documents**
Get all documents with optional filtering.

**Query Parameters:**
- `processId` (string): Filter by process ID
- `category` (string): Filter by document category

**Response:**
```json
[
  {
    "id": "doc_123",
    "name": "System Requirements.pdf",
    "category": "requirements",
    "fileType": "pdf",
    "fileSize": 2048576,
    "uploadedBy": "user_456",
    "uploadedAt": "2025-07-15T10:00:00Z",
    "tags": ["requirements", "system"]
  }
]
```

### **POST /api/documents**
Upload a new document.

**Content-Type:** `multipart/form-data`  
**Form Fields:**
- `file` (file): Document file
- `name` (string): Document name
- `category` (string): Document category
- `description` (string): Optional description
- `tags` (string): Comma-separated tags

### **DELETE /api/documents/:id**
Delete a document.

### **GET /api/documents/tags**
Get all available document tags.

### **Process Document Management**

#### **GET /api/processes/:processId/documents**
Get documents attached to a process.

#### **POST /api/processes/:processId/documents**
Upload a document for a process.

#### **POST /api/processes/:processId/documents/:documentId/attach**
Attach an existing document to a process.

#### **DELETE /api/processes/:processId/documents/:documentId**
Remove document attachment from a process.

#### **GET /api/processes/:processId/available-documents**
Get documents available to attach to a process.

---

## 📁 File Transfer Management

### **GET /api/processes/:processId/file-transfers**
Get file transfer configurations for a process.

**Response:**
```json
[
  {
    "id": "ft_123",
    "processId": "proc_123",
    "name": "Daily Data Import",
    "connectionType": "sftp",
    "direction": "inbound",
    "isActive": true,
    "host": "sftp.client.com",
    "port": 22,
    "username": "datauser",
    "remotePath": "/data/incoming",
    "filePattern": "*.csv",
    "schedule": "daily"
  }
]
```

### **POST /api/processes/:processId/file-transfers**
Create a file transfer configuration.

**Request Body:**
```json
{
  "name": "Data Export",
  "connectionType": "s3",
  "direction": "outbound",
  "host": "s3.amazonaws.com",
  "bucket": "client-data",
  "accessKey": "access_key",
  "secretKey": "secret_key",
  "remotePath": "/exports",
  "filePattern": "export_*.xml",
  "schedule": "weekly"
}
```

### **GET /api/file-transfers/:transferId**
Get a specific file transfer configuration.

### **PUT /api/file-transfers/:transferId**
Update a file transfer configuration.

### **DELETE /api/file-transfers/:transferId**
Delete a file transfer configuration.

---

## 🔔 Notification Management

### **GET /api/processes/:processId/notifications**
Get notification configurations for a process.

**Response:**
```json
[
  {
    "id": "notif_123",
    "processId": "proc_123",
    "recipientEmail": "manager@company.com",
    "recipientName": "Project Manager",
    "recipientRole": "Manager",
    "eventTypes": ["file_received", "process_completed"],
    "isActive": true
  }
]
```

### **POST /api/processes/:processId/notifications**
Create a notification configuration.

**Request Body:**
```json
{
  "recipientEmail": "admin@company.com",
  "recipientName": "System Admin",
  "recipientRole": "Administrator",
  "eventTypes": ["process_error", "approval_required"],
  "isActive": true
}
```

### **GET /api/notifications/:notificationId**
Get a specific notification configuration.

### **PUT /api/notifications/:notificationId**
Update a notification configuration.

### **DELETE /api/notifications/:notificationId**
Delete a notification configuration.

### **GET /api/processes/:processId/notifications/summary**
Get notification summary for a process.

### **GET /api/notifications/events/types**
Get available notification event types.

**Response:**
```json
[
  "file_received",
  "file_delivered",
  "process_started",
  "process_completed",
  "process_error",
  "approval_required"
]
```

---

## 🤖 AI Chat System

### **GET /api/chat/sessions**
Get AI chat sessions for the current user.

**Response:**
```json
[
  {
    "id": "session_123",
    "userId": "user_456",
    "title": "Customer Analysis Discussion",
    "createdAt": "2025-07-15T09:00:00Z",
    "updatedAt": "2025-07-15T09:30:00Z",
    "messageCount": 12
  }
]
```

### **POST /api/chat/sessions**
Create a new AI chat session.

**Request Body:**
```json
{
  "title": "New Chat Session",
  "context": {
    "customerId": "cust_123",
    "processId": "proc_456"
  }
}
```

### **GET /api/chat/sessions/:id/messages**
Get messages for a chat session.

### **POST /api/chat/sessions/:id/messages**
Send a message in a chat session.

**Request Body:**
```json
{
  "content": "What is the status of the customer processes?",
  "type": "user"
}
```

### **AI Configuration**

#### **GET /api/ai/config**
Get AI configuration settings.

#### **POST /api/ai/config**
Update AI configuration.

#### **GET /api/ai/models**
Get available AI models.

---

## 📊 PDF Report Generation

### **GET /api/customers/:id/report-data**
Get aggregated report data for a customer.

**Response:**
```json
{
  "customer": { "id": "cust_123", "name": "Acme Corp" },
  "processes": [ /* process data */ ],
  "contacts": [ /* contact data */ ],
  "services": [ /* service data */ ],
  "documents": [ /* document data */ ],
  "notes": [ /* note data */ ],
  "importantDates": [ /* date data */ ],
  "activity": [ /* activity data */ ]
}
```

### **POST /api/customers/:id/export-pdf**
Generate and download a PDF report for a customer.

**Request Body:**
```json
{
  "format": "A4",
  "orientation": "portrait",
  "sections": [
    "overview",
    "processes",
    "contacts",
    "services",
    "documents",
    "notes",
    "activity"
  ]
}
```

**Response:** PDF file download

---

## ❤️ Health Check

### **GET /api/health**
Get API health status.

**Authentication:** Not required  

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-07-17T10:00:00Z",
  "version": "1.0.0",
  "environment": "production",
  "database": {
    "status": "connected",
    "responseTime": "45ms"
  },
  "memory": {
    "used": "256MB",
    "total": "512MB"
  }
}
```

---

## 📝 Error Responses

### **Standard Error Format**

All API errors follow a consistent format:

```json
{
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Specific field error information"
  },
  "timestamp": "2025-07-17T10:00:00Z"
}
```

### **HTTP Status Codes**

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (authentication required) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (resource already exists) |
| 422 | Unprocessable Entity (business logic error) |
| 500 | Internal Server Error |

### **Common Error Examples**

**Validation Error (400):**
```json
{
  "message": "Validation error",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

**Authentication Error (401):**
```json
{
  "message": "Authentication required",
  "code": "AUTH_REQUIRED"
}
```

**Not Found Error (404):**
```json
{
  "message": "Customer not found",
  "code": "CUSTOMER_NOT_FOUND"
}
```

---

## 🔧 Rate Limiting

API endpoints are protected by rate limiting:

- **General endpoints:** 100 requests per minute per IP
- **Authentication endpoints:** 10 requests per minute per IP
- **File upload endpoints:** 20 requests per minute per user

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1626789600
```

---

## 📚 SDK and Examples

### **JavaScript/TypeScript Example**

```javascript
// API Client setup
const API_BASE = 'http://localhost:3000/api';
const token = localStorage.getItem('jwt_token');

const apiClient = {
  async request(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  },
  
  // Customer methods
  async getCustomers() {
    return this.request('/customers');
  },
  
  async createCustomer(data) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  // Process methods
  async getProcesses(customerId) {
    const query = customerId ? `?customerId=${customerId}` : '';
    return this.request(`/processes${query}`);
  }
};

// Usage examples
try {
  const customers = await apiClient.getCustomers();
  console.log('Customers:', customers);
  
  const newCustomer = await apiClient.createCustomer({
    name: 'New Company',
    email: 'contact@newcompany.com'
  });
  console.log('Created customer:', newCustomer);
} catch (error) {
  console.error('API Error:', error);
}
```

---

*This API documentation provides comprehensive coverage of all available endpoints in the DM_CRM Sales Dashboard. For additional support or questions, contact the development team.*