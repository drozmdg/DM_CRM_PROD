# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DM_CRM is a Customer Relationship Management (CRM) system for B2B consulting and service companies. The application operates with **enterprise-grade authentication and authorization**, providing secure access control with role-based permissions for production use.

## Key Commands

### Development
```bash
npm install          # Install all dependencies (root and client)
npm run dev          # Start backend development server (port 3000)
npm run build        # Build both client and server for production
npm start            # Start production server
npm run check        # Run TypeScript type checking
npm run db:push      # Push database schema changes (Drizzle)
```

### Client-only development (from /client directory)
```bash
npm run dev          # Start Vite development server (port 5173)
npm run build        # Build client for production
npm run preview      # Preview production build
```

## Architecture Overview

### Tech Stack
- **Frontend**: React 18.3, TypeScript, Vite 5.4, TailwindCSS, Shadcn/UI (Radix UI), Wouter routing
- **Backend**: Node.js, Express 4.21, TypeScript
- **Database**: Supabase (PostgreSQL) with Drizzle ORM
- **State Management**: TanStack Query (React Query) v5
- **Build Tools**: Vite (client), ESBuild (server)
- **PDF Generation**: jsPDF for cross-platform PDF creation

### Project Structure
- `/client` - React frontend application
  - `/src/components` - Reusable UI components
  - `/src/pages` - Application pages/routes
  - `/src/hooks` - Custom React hooks
  - `/src/lib` - Utility functions and API clients
  - `/src/contexts` - React contexts (ChatContext, AuthContext)
- `/server` - Express backend
  - `/lib/database` - Database service layer (customerService, processService, etc.)
  - `/lib/ai-chat` - AI chat integration
  - `routes.ts` - All API route definitions
  - `storage_new.js` - Main storage abstraction layer
- `/shared` - Shared types between client and server

### Key API Routes (Protected with JWT authentication)
- **Customers**: GET/POST `/api/customers`, GET/PUT/DELETE `/api/customers/:id`
- **Processes**: GET/POST `/api/processes`, GET/PUT/DELETE `/api/processes/:id`
- **Services**: GET/POST `/api/services`, GET/PUT/DELETE `/api/services/:id`
- **Documents**: GET/POST `/api/documents`, GET/DELETE `/api/documents/:id`
- **Timeline**: GET/POST `/api/timeline`, GET/POST `/api/process-timeline`
- **Contacts**: GET/POST `/api/contacts`, GET/PUT/DELETE `/api/contacts/:id`
- **Internal Contact Assignment**: GET `/api/contacts/internal`, GET `/api/contacts/:contactId/assignments`, POST/DELETE `/api/contacts/:contactId/assign/:customerId`
- **Customer Notes**: GET/POST `/api/customers/:id/notes`, PUT/DELETE `/api/customers/notes/:id`
- **Important Dates**: GET/POST `/api/customers/:id/important-dates`, PUT/DELETE `/api/customers/important-dates/:id`, GET `/api/important-dates/upcoming`
- **Process Tasks**: GET/POST `/api/processes/:id/tasks`, GET/PUT/DELETE `/api/tasks/:id`, GET `/api/processes/:id/progress`
- **Process Teams**: GET `/api/processes/:id/teams`, POST/DELETE `/api/processes/:id/teams/:teamId`
- **File Transfers**: GET/POST `/api/processes/:id/file-transfers`, GET/PUT/DELETE `/api/file-transfers/:id`
- **Notifications**: GET/POST `/api/processes/:id/notifications`, GET/PUT/DELETE `/api/notifications/:id`, GET `/api/notifications/events/types`
- **Dashboard**: GET `/api/dashboard/metrics`
- **AI Chat**: POST `/api/ai-chat/send`, GET `/api/ai-chat/sessions`
- **PDF Reports**: GET `/api/customers/:id/report-data`, POST `/api/customers/:id/export-pdf`

### Database Services
Each domain has a dedicated service in `/server/lib/database/`:
- `customerService.ts` - Customer management
- `processService.ts` - Process and SDLC tracking
- `serviceService.ts` - Service management
- `documentService.ts` - Document storage
- `timelineService.ts` - Timeline events
- `contactService.ts` - Contact management
- `teamService.ts` - Team member management and process assignments
- `taskService.ts` - Process tasks, milestones, and progress tracking
- `fileTransferService.ts` - File transfer configurations for data movement
- `notificationService.ts` - Process event notifications and recipients
- `noteService.ts` - Customer notes and important dates management
- `chatService.ts` - AI chat sessions
- `reportService.ts` - Customer report data aggregation for PDF generation
- `simplePdfService.ts` - PDF generation using jsPDF (cross-platform compatible)

### Frontend Routing
Using Wouter for client-side routing:
- `/` - Dashboard
- `/customers` - Customer list
- `/customers/:customerId` - Customer profile
- `/processes` - Process list
- `/processes/:processId` - Process details
- `/services` - Service management
- `/documents` - Document management
- `/timeline` - Timeline view
- `/ai-chat` - AI chat interface

### Path Aliases
- `@/` - Maps to `/client/src/`
- `@shared/` - Maps to `/shared/`

## Environment Configuration

Required in `/server/.env`:
```bash
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
JWT_SECRET=your-secure-jwt-secret-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=development
PORT=3000
```

## Important Notes

1. **Enterprise Authentication**: This is a production-ready application with comprehensive JWT-based authentication. All data is protected with role-based access control.

2. **ESM Modules**: The project uses ES modules (`"type": "module"` in package.json).

3. **TypeScript**: Full TypeScript support with strict type checking. Run `npm run check` to verify types.

4. **Development Workflow**: Frontend (port 5173) and backend (port 3000) run separately in development.

5. **Database**: Uses Supabase for data storage and authentication. Full authentication features are enabled with Row-Level Security.

6. **File Storage**: Documents are stored in Supabase storage buckets.

7. **AI Integration**: AI chat features are available at `/ai-chat` with context-aware capabilities.

8. **Form Validation**: Uses Zod schemas for runtime validation (see `/server/validation.ts`).

9. **Error Handling**: Comprehensive error handling with user-friendly messages.

10. **Responsive Design**: Mobile-friendly UI using TailwindCSS responsive utilities.

11. **Build Process**: Client builds to `dist/public`, server bundles to `dist/index.js`. Production serves both from single Node.js entry point.

12. **Database Schema**: PostgreSQL schema defined in `/server/database/schema.sql` with migrations in `/server/database/migrations/`. Includes enhanced tables for comprehensive business process management:
    - `customer_notes` and `customer_important_dates` - Customer relationship tracking
    - `process_tasks` and `process_milestones` - Task management and progress tracking
    - `process_team` - Team assignments to processes
    - `process_file_transfers` - File transfer configurations (SFTP, S3, ADLS, etc.)
    - `process_notifications` - Event-driven notification system

## Enhanced Process Management Features

### File Transfer Configuration
The system now supports comprehensive file transfer management for data integration workflows:

**Supported Connection Types:**
- **SFTP** - Secure File Transfer Protocol connections
- **Amazon S3** - AWS S3 bucket integration
- **Azure Data Lake Storage (ADLS)** - Microsoft Azure storage
- **FTP** - Standard File Transfer Protocol
- **HTTP/HTTPS** - Web-based file transfers
- **Local File System** - Server-local file operations

**Configuration Options:**
- **Direction**: Inbound (pickup) or Outbound (delivery)
- **File Patterns**: Wildcard support (*.csv, report_*.xml, etc.)
- **Scheduling**: Manual, hourly, daily, weekly, or monthly transfers
- **Connection Settings**: Host, credentials, paths, and protocol-specific options
- **Active/Inactive Status**: Enable or disable transfers as needed

**Security Features:**
- Credential references (passwords never stored directly)
- Connection configuration validation
- Masked sensitive data in logs and UI

### Process Notification System
Event-driven notifications keep stakeholders informed about process status:

**Available Event Types:**
- File received/delivered
- Process started/completed/error
- Approval required/received
- Schedule updates

**Recipient Management:**
- Multiple recipients per process
- Role-based organization (Data Provider, Project Manager, etc.)
- Granular event subscription (per-recipient, per-event)
- Email validation and active/inactive status

**Notification Features:**
- Real-time event tracking
- Configurable notification preferences
- Recipient summary and analytics
- Event type management

### Enhanced UI Components

**Document Viewer Enhancements:**
- **Enhanced File Support**: Word (.doc, .docx), Excel (.xlsx, .xls), CSV, SQL, text, PDF, and image files
- **Rich Previews**: Formatted Word content, interactive Excel sheets, searchable CSV tables, syntax-highlighted code
- **Interactive Features**: Search within files, export data, copy code, language detection
- **Consistent Experience**: Same DocumentViewer component used across all document access points
- **WSL-Optimized**: Client-side processing for better performance in WSL environments

**Document Upload System:**
- **Consistent Upload Interface**: Standard DocumentUpload component used throughout application
- **Proper Modal Handling**: Fixed nested dialog issues with multiple close methods (X button, Cancel, ESC, outside click)
- **Customer-Specific Upload**: CustomerDocumentManager uses simplified standard upload (removed complex custom form)
- **Process Document Upload**: ProcessDocumentManager with proper close functionality

**Process Modal Enhancements:**
- New "File Transfers" tab for connection configuration
- New "Notifications" tab for recipient management
- Removed manual progress tracking (now auto-calculated from tasks)

**Process Details Page:**
- 6-tab interface: Overview, Tasks, Milestones, File Transfers, Notifications, Documents
- Real-time progress tracking based on task completion
- Team assignment with finance code display
- Comprehensive file transfer and notification management
- Enhanced document viewing with rich file previews

**Task Management:**
- Progress calculation based on actual task completion (not milestones)
- Task-based metrics throughout the application
- Hierarchical task structure with subtasks
- Task assignment to contacts with due dates and priorities

### Data Integration Workflow
The enhanced system supports end-to-end data integration processes:

1. **Process Setup**: Define the business process with stakeholders
2. **Team Assignment**: Assign teams with finance codes for billing/tracking
3. **File Transfer Configuration**: Set up data movement (inbound/outbound)
4. **Notification Setup**: Configure who gets notified for which events
5. **Task Management**: Break down work into trackable tasks
6. **Progress Monitoring**: Real-time progress based on task completion
7. **Event Notifications**: Automated stakeholder communication

## PDF Report Generation

The system includes comprehensive PDF report generation for customer data export and documentation.

### Features
- **Comprehensive Data Export**: Aggregates all customer-related data from multiple tables
- **Configurable Reports**: Users can select which sections to include in the report
- **Professional Formatting**: Clean, structured PDF layout with company branding
- **Cross-Platform Compatible**: Uses jsPDF library for reliable generation across environments
- **Download Management**: Automatic file naming and browser download handling

### Report Contents
Generated reports include the following sections (user-selectable):
- **Customer Overview**: Basic information, contract dates, and summary statistics
- **Performance Analytics**: Completion rates, progress metrics, and delivery performance
- **Process Details**: All customer processes with status, progress, and descriptions
- **Contact Information**: Customer contacts with roles and contact details
- **Service Agreements**: Monthly hours and service details
- **Team Assignments**: Assigned teams with finance codes and pharmaceutical products
- **Document Library**: Uploaded documents with categories and metadata
- **Important Dates**: Customer milestones and key dates
- **Recent Activity**: Process timeline events and system activity

### Usage
1. **Access**: Navigate to any customer profile page
2. **Export Button**: Click "Export Report" button in the customer header
3. **Configuration**: Select report format (A4/Letter), orientation, and sections to include
4. **Generation**: Click "Generate Report" to create and download the PDF
5. **Download**: PDF automatically downloads with structured filename

### Technical Implementation
- **Frontend**: `CustomerReportExportModal` component for configuration
- **Backend Services**: 
  - `reportService.ts` - Data aggregation from all customer-related tables
  - `simplePdfService.ts` - PDF generation using jsPDF library
- **API Endpoints**:
  - `GET /api/customers/:id/report-data` - Get structured report data
  - `POST /api/customers/:id/export-pdf` - Generate and download PDF
- **Data Sources**: Aggregates from customers, processes, contacts, documents, services, teams, notes, important dates, and activity tables

### Report Format
- **Header**: Customer name and report generation date
- **Sections**: Organized by data type with clear headings
- **Tables**: Structured data presentation with proper formatting
- **Pagination**: Automatic page breaks and page numbering
- **Footer**: Generation timestamp and page numbers

### Future Enhancements
- Advanced template customization
- Chart and visualization integration
- Scheduled report generation
- Email delivery options
- Multiple export formats (Excel, CSV)