# DM_CRM - Customer Relationship Management System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![Status](https://img.shields.io/badge/status-✅%20PRODUCTION%20READY-green.svg)
![Implementation](https://img.shields.io/badge/auth-Enterprise%20Authentication-blue.svg)
![Security](https://img.shields.io/badge/security-Production%20Grade-green.svg)

## 🎉 Project Status: PRODUCTION READY - ENTERPRISE AUTHENTICATION

**Latest Update:** July 15, 2025 (Enterprise Authentication System Complete)  
**Current Version:** 1.0.0 - Production-ready with comprehensive security  
**Security Level:** Enterprise-grade authentication and authorization

## Overview

DM_CRM is a Customer Relationship Management system designed for B2B consulting and service companies. This application operates with **enterprise-grade authentication and authorization**, providing secure access control with role-based permissions for production use.

## ✨ Features

### **Core Dashboard**
- ✅ **Real-time Metrics**: Live customer, process, and service statistics
- ✅ **Quick Actions**: One-click access to create customers, services, and processes
- ✅ **Activity Tracking**: Recent activity feed and process monitoring
- ✅ **Performance Overview**: Active processes and completion tracking

### **Customer Management**
- ✅ **Complete Customer Profiles**: Comprehensive customer information management
- ✅ **Contact Management**: Track customer contacts and their roles
- ✅ **Internal Contact Assignment**: Assign internal contacts to multiple customers via many-to-many relationships
- ✅ **Service Assignment**: Manage customer services and monthly hours
- ✅ **Document Storage**: Integrated document management with categorization
- ✅ **Communication History**: Complete interaction tracking and timeline
- ✅ **Customer Notes**: Add and manage timestamped notes for customer interactions
- ✅ **Important Dates**: Track key dates like renewals, reviews, and milestones

### **Process Management**
- ✅ **SDLC Tracking**: Software Development Lifecycle stage monitoring
- ✅ **Progress Monitoring**: Real-time progress tracking and milestone management
- ✅ **Team Assignment**: Assign team members and track responsibilities
- ✅ **Timeline Visualization**: Process timeline and milestone tracking with fixed event creation
- ✅ **Edit Functionality**: Full process editing capabilities

### **Service Management**
- ✅ **Service Creation**: Create and manage customer services
- ✅ **Hours Tracking**: Monthly hours allocation and monitoring
- ✅ **Customer Integration**: Seamless integration with customer profiles
- ✅ **Performance Metrics**: Service utilization and performance tracking

### **Advanced Features**
- ✅ **Enhanced Document Management**: 
  - **Rich File Viewer**: Word, Excel, CSV, SQL, text, PDF, and image previews
  - **Interactive Features**: Search within files, export data, syntax highlighting
  - **Consistent Upload Interface**: Unified document upload across all modules
  - **WSL-Optimized**: Client-side processing for better performance
- ✅ **Team Coordination**: Assign team members to customers and track responsibilities
- ✅ **Search & Filtering**: Advanced search capabilities across all modules
- ✅ **Responsive Design**: Modern, mobile-friendly interface
- ✅ **Data Validation**: Comprehensive form validation and error handling
- ✅ **PDF Report Generation**: Comprehensive customer reports with configurable sections and professional formatting

## Technology Stack

- **Frontend**: React 18.3, TypeScript, TailwindCSS, Shadcn/UI
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL) with Row-Level Security (RLS)
- **Authentication**: **JWT-based with Supabase** - Enterprise authentication system
- **Security**: **Production-grade** - Comprehensive security middleware, rate limiting, input validation
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query)
- **PDF Generation**: jsPDF for cross-platform report generation
- **File Processing**: Mammoth (Word), XLSX (Excel), PapaParse (CSV), React Syntax Highlighter (Code)

## Project Structure

```
DM_CRM/
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions
│   │   ├── pages/        # Application pages
│   │   └── App.tsx       # Main application component
│   ├── index.html        # HTML entry point
│   ├── package.json      # Client dependencies
│   └── vite.config.ts    # Vite configuration
├── server/               # Backend Express server
│   ├── lib/
│   │   ├── database/     # Database service layer
│   │   └── supabase.ts   # Supabase client configuration
│   ├── .env              # Server environment variables
│   ├── routes.ts         # API routes
│   └── index.ts          # Server entry point
├── shared/               # Shared types between client and server
├── development-archive/  # Development documentation
└── README.md             # Project documentation
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Supabase project (for database operations only - no auth needed)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/DM_CRM.git
cd DM_CRM
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create server environment file
# Edit server/.env with your Supabase database credentials
```

Required environment variables in `server/.env`:
```bash
# Supabase Configuration (Database and Authentication)
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# JWT Configuration
JWT_SECRET=your-secure-jwt-secret-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
NODE_ENV=development
PORT=3000
```

4. Start the application:
```bash
# Start the development server (integrated frontend + backend)
npm run dev
```

The application will be available at:
- Application: http://localhost:5000 (serves both frontend and API)
- API endpoints: http://localhost:5000/api/*

### Security and Authentication

This application operates with **enterprise-grade security and authentication**:
- **Secure login required** - JWT-based authentication for all access
- **Role-based access control** - Admin, Manager, and Viewer roles with granular permissions
- **Comprehensive security layer** - All data protected with user-based access control
- **Full Supabase integration** - Database and authentication services with Row-Level Security
- **Production-ready** - Suitable for production environments with sensitive data
- **Advanced session management** - Secure JWT tokens with automatic refresh and cleanup

## Security & Access

### Current Security Model
✅ **ENTERPRISE-GRADE AUTHENTICATION AND SECURITY**

This application features a **comprehensive authentication system**:
- **Secure Access**: JWT-based authentication required for all application features
- **Role-Based Access Control**: Admin, Manager, and Viewer roles with granular permissions
- **Data Protection**: All data protected with user-based access control and Row-Level Security
- **Production Ready**: Suitable for production environments with sensitive business data

### Security Features
The following security features are fully implemented and active:
- **User authentication** (secure login/logout with JWT tokens)
- **User roles and permissions** (Admin/Manager/Viewer with granular controls)
- **Session management** (automatic token refresh, secure logout, session cleanup)
- **JWT tokens** (secure token generation, validation, and refresh)
- **Row Level Security (RLS)** (database-level access control)
- **Access control middleware** (route protection, role verification)
- **User assignment system** (customer and process ownership tracking)
- **Audit logging** (security events, authentication attempts, system access)
- **Security hardening** (Helmet.js, rate limiting, input validation, CORS)
- **Account protection** (failed login attempt lockout, password requirements)

### Data Access Control
- **Role-Based Access**: Users access data based on their assigned role and permissions
- **Granular Restrictions**: Create, read, update, and delete permissions controlled per role
- **Ownership System**: Data ownership and assignment tracking for customer and process management
- **Audit Trail**: Complete logging of all data access and modifications

## Development Status

### Current Implementation Status
- **Phase 1**: Enterprise authentication and authorization system ✅
- **Phase 2**: Core UI and customer management ✅
- **Phase 3**: Process tracking and timeline visualization ✅
- **Phase 4**: Service management ✅
- **Phase 5**: Document management with secure access ✅
- **Phase 6**: Security hardening and production optimization ✅

### System Capabilities
- Enterprise-grade user authentication and security
- Role-based data isolation and access control
- Multi-user production environment ready
- Comprehensive audit logging and security monitoring
- Automated session management and cleanup
- Production-ready backup and recovery support

## Development Commands

```bash
# Install dependencies
npm install

# Start integrated development server (frontend + backend)
npm run dev

# Client-only development (from /client directory)
cd client && npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database operations
npm run db:push    # Push schema changes with Drizzle

# Type checking
npm run check      # TypeScript type checking
```

## API Documentation

### Available API Routes
All API routes are **protected with authentication** (JWT required):

#### Core Data Management
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create new customer
- `GET /api/customers/:id` - Get a single customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Soft delete a customer
- `PATCH /api/customers/:id/reactivate` - Restore a soft-deleted customer
- `GET /api/processes` - Get all processes
- `POST /api/processes` - Create new process
- `PUT /api/processes/:id` - Update process
- `DELETE /api/processes/:id` - Delete process
- `GET /api/services` - Get all services
- `POST /api/services` - Create new service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service
- `GET /api/products` - Get all products
- `POST /api/products` - Create a new product
- `GET /api/products/:id` - Get a single product
- `PUT /api/products/:id` - Update a product
- `DELETE /api/products/:id` - Delete a product
- `GET /api/teams` - Get all teams
- `POST /api/teams` - Create a new team
- `GET /api/teams/:id` - Get a single team
- `PUT /api/teams/:id` - Update a team
- `DELETE /api/teams/:id` - Delete a team

#### Additional Features
- `GET /api/contacts` - Get all contacts
- `POST /api/contacts` - Create new contact
- `GET /api/contacts/internal` - Get all internal contacts
- `GET /api/contacts/:contactId/assignments` - Get customer assignments for an internal contact
- `POST /api/contacts/:contactId/assign/:customerId` - Assign internal contact to customer
- `DELETE /api/contacts/:contactId/assign/:customerId` - Unassign internal contact from customer
- `GET /api/documents` - Get all documents
- `POST /api/documents` - Upload document
- `DELETE /api/documents/:id` - Delete a document
- `GET /api/timeline` - Get timeline events
- `POST /api/timeline` - Create timeline event
- `GET /api/dashboard/metrics` - Get dashboard metrics
- `GET /api/dashboard/metrics-legacy` - Get legacy dashboard metrics
- `GET /api/customers/:id/notes` - Get customer notes
- `POST /api/customers/:id/notes` - Create customer note
- `PUT /api/customers/notes/:id` - Update customer note
- `DELETE /api/customers/notes/:id` - Delete customer note
- `GET /api/customers/:id/important-dates` - Get important dates
- `POST /api/customers/:id/important-dates` - Create important date
- `PUT /api/customers/important-dates/:id` - Update important date
- `DELETE /api/customers/important-dates/:id` - Delete important date
- `GET /api/important-dates/upcoming` - Get upcoming important dates
- `POST /api/ai-chat/send` - Send AI chat message
- `GET /api/ai-chat/sessions` - Get chat sessions
- `GET /api/chat/sessions/:id/messages` - Get messages for a chat session
- `POST /api/chat/sessions/:id/messages` - Post a message to a chat session
- `GET /api/health` - Health check
- `GET /api/contacts/:id/communications` - Get communications for a contact
- `GET /api/communications` - Get all communications
- `GET /api/communications/:id` - Get a single communication
- `PUT /api/communications/:id` - Update a communication
- `DELETE /api/communications/:id` - Delete a communication
- `GET /api/tasks/upcoming` - Get upcoming tasks
- `GET /api/tasks/:id` - Get a single task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task
- `POST /api/tasks/:id/subtasks` - Create a subtask
- `GET /api/processes/progress/all` - Get progress for all processes
- `GET /api/processes/:processId/progress` - Get progress for a process
- `GET /api/processes/:processId/milestones` - Get milestones for a process
- `POST /api/processes/:processId/milestones` - Create a milestone for a process
- `PUT /api/milestones/:id` - Update a milestone
- `DELETE /api/milestones/:id` - Delete a milestone
- `POST /api/products/:productId/teams` - Assign a team to a product
- `DELETE /api/products/:productId/teams/:teamId` - Unassign a team from a product
- `GET /api/teams/:teamId/products` - Get products for a team
- `GET /api/products/metrics` - Get product metrics
- `GET /api/products/team/:teamId` - Get products for a team
- `GET /api/processes/:processId/teams` - Get teams for a process
- `POST /api/processes/:processId/teams/:teamId` - Assign a team to a process
- `DELETE /api/processes/:processId/teams/:teamId` - Unassign a team from a process
- `GET /api/processes/:processId/file-transfers` - Get file transfers for a process
- `POST /api/processes/:processId/file-transfers` - Create a file transfer for a process
- `GET /api/file-transfers/:transferId` - Get a single file transfer
- `PUT /api/file-transfers/:transferId` - Update a file transfer
- `DELETE /api/file-transfers/:transferId` - Delete a file transfer
- `GET /api/processes/:processId/notifications` - Get notifications for a process
- `POST /api/processes/:processId/notifications` - Create a notification for a process
- `GET /api/notifications/:notificationId` - Get a single notification
- `PUT /api/notifications/:notificationId` - Update a notification
- `DELETE /api/notifications/:notificationId` - Delete a notification
- `GET /api/processes/:processId/notifications/summary` - Get notification summary for a process
- `GET /api/notifications/events/types` - Get available notification event types
- `GET /api/processes/:processId/documents` - Get documents for a process
- `POST /api/processes/:processId/documents` - Add a document to a process
- `POST /api/processes/:processId/documents/:documentId/attach` - Attach an existing document to a process
- `DELETE /api/processes/:processId/documents/:documentId` - Remove a document from a process
- `GET /api/processes/:processId/available-documents` - Get documents available to be added to a process
- `GET /api/ai/config` - Get AI configuration
- `POST /api/ai/config` - Update AI configuration
- `GET /api/ai/models` - Get available AI models

**Note**: All endpoints require valid JWT authentication tokens in the Authorization header.

## Deployment

### Production Deployment
This application is production-ready with enterprise security:

1. **Environment Setup**:
```bash
# Production environment variables
NODE_ENV=production
SUPABASE_URL=your-production-supabase-url
SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
JWT_SECRET=your-secure-production-jwt-secret
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

2. **Build and Deploy**:
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Production Security Features
✅ **SAFE FOR PUBLIC AND PRODUCTION ENVIRONMENTS**
- Enterprise authentication ensures only authorized users can access data
- Suitable for production environments with sensitive business data
- Comprehensive security hardening including rate limiting and input validation
- All data protected with role-based access control and audit logging

### Recommended Use Cases
- Production business environments
- Multi-user customer relationship management
- Secure business process tracking
- Enterprise document management
- Team collaboration with access controls
- Customer data management with audit compliance

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Built with [React 18.3](https://reactjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database by [Supabase](https://supabase.io/) (data storage only)
- Routing by [Wouter](https://github.com/molefrog/wouter)

---

**✅ Production Ready: Enterprise-grade authentication and security system. Safe for production use with sensitive business data.**
