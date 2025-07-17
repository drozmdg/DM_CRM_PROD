# Sales Dashboard - Customer Relationship Management System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![Status](https://img.shields.io/badge/status-✅%20DEMO%20MODE-yellow.svg)
![Implementation](https://img.shields.io/badge/auth-No%20Authentication-lightgrey.svg)
![Security](https://img.shields.io/badge/security-Internal%20Use%20Only-orange.svg)

## 🎉 Project Status: INTERNAL DEMO MODE - NO AUTHENTICATION

**Latest Update:** June 16, 2025 (Authentication Completely Removed)  
**Current Version:** 1.0.0 - Demo application with no authentication system  
**Security Level:** Internal use only - No authentication required

## Overview

Sales Dashboard is a Customer Relationship Management system designed for B2B consulting and service companies. This application operates in demo mode with **all authentication completely removed**, making it suitable for internal demonstrations, evaluations, and prototyping.

## ✨ Features

### **Core Dashboard**
- ✅ **Real-time Metrics**: Live customer, process, and service statistics
- ✅ **Quick Actions**: One-click access to create customers, services, and processes
- ✅ **Activity Tracking**: Recent activity feed and process monitoring
- ✅ **Performance Overview**: Active processes and completion tracking

### **Customer Management**
- ✅ **Complete Customer Profiles**: Comprehensive customer information management
- ✅ **Contact Management**: Track customer contacts and their roles
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
- ✅ **Document Management**: File upload, categorization, and version control
- ✅ **Team Coordination**: Assign team members to customers and track responsibilities
- ✅ **Search & Filtering**: Advanced search capabilities across all modules
- ✅ **Responsive Design**: Modern, mobile-friendly interface
- ✅ **Data Validation**: Comprehensive form validation and error handling

## Technology Stack

- **Frontend**: React 18.3, TypeScript, TailwindCSS, Shadcn/UI
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL) - Database operations only
- **Authentication**: **NONE** - Authentication system completely removed
- **Security**: **NONE** - No security layer (demo mode only)
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query)

## Project Structure

```
SalesDashboard/
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
git clone https://github.com/yourusername/SalesDashboard.git
cd SalesDashboard
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
# Supabase Configuration (Database only - no auth)
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key

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

### Demo Mode Notes

This application operates in demo mode with **all authentication completely removed**:
- **No login required** - Direct access to all features
- **No user management** - All permissions automatically granted
- **No security layer** - All data is accessible to anyone with access to the application
- **Uses Supabase for data storage only** - Authentication features disabled
- **Internal use only** - Not suitable for production use with sensitive data
- **No session management** - No user sessions or tokens

## Security & Access

### Current Security Model
⚠️ **IMPORTANT: NO AUTHENTICATION OR SECURITY**

This application has **no authentication system**:
- **Open Access**: Anyone with access to the application URL can use all features
- **No User Roles**: No user management, roles, or permissions
- **No Data Protection**: All data is accessible without restrictions
- **Demo/Internal Use Only**: Suitable only for internal demonstrations and development

### Removed Features
The following security features have been completely removed:
- User authentication (login/logout)
- User roles and permissions
- Session management
- JWT tokens
- Row Level Security (RLS)
- Access control
- User assignment system
- Audit logging for security events

### Data Access
- **Full Access**: All users have complete access to all data
- **No Restrictions**: Create, read, update, and delete permissions for all data
- **No Assignment System**: No concept of data ownership or user assignments

## Development Status

### Current Implementation Status
- **Phase 1**: Core UI and customer management ✅
- **Phase 2**: Process tracking and timeline visualization ✅
- **Phase 3**: Service management ✅
- **Phase 4**: Document management ✅
- **Phase 5**: Authentication system removal ✅
- **Phase 6**: Demo mode optimization ✅

### Known Limitations
- No user authentication or security
- No data isolation between different use cases
- Not suitable for multi-tenant environments
- No backup or data recovery features in demo mode

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
All API routes are **publicly accessible** (no authentication):

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

**Note**: All endpoints are open and require no authentication headers or tokens.

## Deployment

### Demo Mode Deployment
This application is designed for internal demo use only:

1. **Environment Setup**:
```bash
# Production environment variables
NODE_ENV=production
SUPABASE_URL=your-production-supabase-url
SUPABASE_ANON_KEY=your-production-anon-key
```

2. **Build and Deploy**:
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Important Security Warnings
⚠️ **DO NOT DEPLOY TO PUBLIC ENVIRONMENTS**
- No authentication means anyone can access and modify data
- Suitable only for internal networks or private environments
- Consider adding basic HTTP authentication at the network level if needed
- All data will be accessible to anyone with the URL

### Recommended Use Cases
- Internal company demonstrations
- Development and testing environments
- Proof of concept presentations
- Training and educational purposes
- Prototyping and mockup development

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Built with [React 18.3](https://reactjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database by [Supabase](https://supabase.io/) (data storage only)
- Routing by [Wouter](https://github.com/molefrog/wouter)

---

**⚠️ Reminder: This is a demo application with no authentication. Use only in secure, internal environments.**
