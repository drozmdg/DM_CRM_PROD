# Document Upload Functionality Guide

## Overview

The Sales Dashboard application provides robust document upload functionality that allows users to upload and manage documents for customers. This document provides a comprehensive guide on how the document upload system works, including its architecture, components, and data flow.

## System Architecture

### Frontend Components

#### 1. DocumentUpload Component (`client/src/components/DocumentUpload.tsx`)
- **Purpose**: Main document upload modal for uploading documents across the application
- **Location**: Can be triggered from multiple places (Dashboard quick actions, navigation, etc.)
- **Features**:
  - Customer selection dropdown
  - File information input (name, description, category)
  - Form validation using Zod schema
  - Success/error handling with toast notifications

#### 2. CustomerDocumentManager Component (`client/src/components/CustomerDocumentManager.tsx`)
- **Purpose**: Customer-specific document management interface
- **Location**: Embedded within customer detail pages
- **Features**:
  - Upload documents specifically for a selected customer
  - View existing customer documents
  - Document categorization and filtering
  - Integrated with customer context

### Backend Architecture

#### 1. API Routes (`server/routes.ts`)
- **Main Upload Endpoint**: `POST /api/documents`
- **Customer-Specific Endpoint**: `POST /api/customers/:customerId/documents`
- **Document Retrieval**: `GET /api/documents` and `GET /api/customers/:customerId/documents`

#### 2. Storage Layer (`server/storage_new.ts`)
- **Interface**: Implements `IStorageService` for consistent API
- **Methods**:
  - `createDocument()`: Creates new document records
  - `getDocuments()`: Retrieves document lists
  - `getDocument()`: Retrieves single document
  - `updateDocument()`: Updates document metadata
  - `deleteDocument()`: Removes documents

#### 3. Database Service (`server/lib/database/documentService.ts`)
- **Purpose**: Direct database operations for document management
- **Key Methods**:
  - `createDocument()`: Inserts document records into database
  - `getDocumentsByCustomerId()`: Retrieves customer-specific documents
  - `getAllDocuments()`: Retrieves all documents with customer info

## Data Flow

### 1. Document Upload Process

```
Frontend Form → Validation → API Request → Storage Layer → Database → Response
```

#### Step-by-Step Process:

1. **User Input**: User fills out document upload form
2. **Validation**: Frontend validates data using Zod schema
3. **API Request**: POST request sent to `/api/documents` endpoint
4. **Route Handler**: Express route processes request
5. **Storage Layer**: `storage_new.ts` handles business logic
6. **Database Service**: `documentService.ts` performs database operations
7. **Response**: Success/error response returned to frontend
8. **UI Update**: Frontend updates UI and shows confirmation

### 2. Data Schema

#### Frontend Document Interface (`shared/types/index.ts`)
```typescript
interface Document {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  category: DocumentCategory;
  uploadDate: string;
  customerId: string;
  description?: string;
}
```

#### Database Schema
```sql
documents table:
- id (VARCHAR, PRIMARY KEY)
- name (VARCHAR)
- url (VARCHAR)
- size (INTEGER)
- type (VARCHAR)
- category (VARCHAR)
- upload_date (VARCHAR)
- customer_id (VARCHAR, FOREIGN KEY)
- description (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Component Integration

### 1. Document Upload Modal Usage

The `DocumentUpload` component can be triggered from multiple locations:

```typescript
// Dashboard quick action
<DocumentUpload 
  trigger={<Button>Upload Document</Button>} 
  onSuccess={() => window.location.reload()} 
/>

// Navigation menu
<DocumentUpload 
  trigger={<MenuItem>Upload Document</MenuItem>}
  customerId={selectedCustomerId}
/>
```

### 2. Customer Document Manager Usage

```typescript
// Within customer detail page
<CustomerDocumentManager 
  customerId={customer.id}
  documents={customer.documents}
  onDocumentAdded={handleDocumentAdded}
/>
```

## Key Features

### 1. Customer Selection
- Dropdown with all active customers
- Real-time customer data loading
- Validation ensures customer is selected

### 2. Document Categories
- Contract
- Proposal
- Requirements
- Report
- Other

### 3. File Validation
- File type validation
- Size restrictions
- Required fields validation

### 4. Error Handling
- Network error handling
- Validation error display
- User-friendly error messages
- Toast notifications for feedback

## API Endpoints

### 1. Upload Document
```http
POST /api/documents
Content-Type: application/json

{
  "name": "Document Name.pdf",
  "description": "Document description",
  "url": "http://localhost:5000/uploads/file.pdf",
  "type": "application/pdf",
  "category": "Contract",
  "size": 1024000,
  "customerId": "c-1747405124432"
}
```

**Response:**
```json
{
  "id": "99cfef3f-3a0b-41a4-9954-3ab2f62b8f4f",
  "name": "Document Name.pdf",
  "url": "http://localhost:5000/uploads/file.pdf",
  "size": 1024000,
  "type": "application/pdf",
  "category": "Contract",
  "uploadDate": "2025-05-29",
  "customerId": "c-1747405124432",
  "description": "Document description"
}
```

### 2. Get Customer Documents
```http
GET /api/customers/:customerId/documents
```

### 3. Get All Documents
```http
GET /api/documents
```

## Database Operations

### 1. Document Creation
The system performs the following database operations when creating a document:

1. **Validation**: Ensures customer exists and data is valid
2. **ID Generation**: Creates unique document ID using `crypto.randomUUID()`
3. **Date Handling**: Sets upload_date to current date
4. **Insert**: Adds record to documents table
5. **Return**: Returns complete document object

### 2. Document Retrieval
- **By Customer**: Filters documents by customer_id
- **All Documents**: Joins with customers table for complete data
- **Single Document**: Retrieves by document ID

## Configuration

### 1. File Upload Settings
- **Upload Directory**: `/uploads/` (served statically)
- **Base URL**: `http://localhost:5000/uploads/`
- **Supported Types**: PDF, DOC, DOCX, XLS, XLSX, images

### 2. Validation Rules
```typescript
const documentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  url: z.string().url("Valid URL required"),
  type: z.string().min(1, "File type required"),
  category: z.enum(DocumentCategories),
  size: z.number().positive("Size must be positive"),
  customerId: z.string().min(1, "Customer selection required")
});
```

## Recent Fixes Applied

### 1. Customer Selection Fix
- **Issue**: "Expected number, received nan" validation error
- **Solution**: Changed `customerId` validation from `number` to `string`
- **Files**: `DocumentUpload.tsx`, validation schemas

### 2. Database Field Mapping Fix
- **Issue**: `uploaded_date` column doesn't exist, should be `upload_date`
- **Solution**: Updated all references in `DocumentService.ts`
- **Impact**: Document creation now works correctly

### 3. Storage Layer Implementation
- **Issue**: Mock operations instead of real database calls
- **Solution**: Replaced all mock functions with actual database operations
- **Files**: `storage_new.ts`

### 4. Data Format Consistency
- **Issue**: Mismatched field names between frontend and backend
- **Solution**: Standardized on `uploadDate` (frontend) → `upload_date` (database)

## Testing

### 1. API Testing
Use the provided test scripts:
```bash
node test-final-upload.mjs
node test-both-uploads.mjs
```

### 2. Manual Testing
1. Navigate to `http://localhost:5173`
2. Click "Upload Document" from dashboard or navigation
3. Fill out form with valid data
4. Submit and verify success message
5. Check that document appears in customer's document list

### 3. Database Verification
```sql
SELECT * FROM documents WHERE customer_id = 'c-1747405124432';
```

## Troubleshooting

### Common Issues

1. **"Customer is required" Error**
   - Ensure customer is selected from dropdown
   - Check that customer data is loading properly

2. **"Failed to create document" Error**
   - Check database connection
   - Verify customer ID exists
   - Check server logs for detailed error

3. **Documents Not Appearing**
   - Verify document was created in database
   - Check customer ID matching
   - Refresh the page or customer data

### Debug Steps

1. **Check Server Logs**: Look for detailed error messages
2. **Verify API Responses**: Use browser dev tools Network tab
3. **Database Query**: Check if document was actually created
4. **Customer Data**: Ensure customer exists and is active

## Future Enhancements

### Potential Improvements

1. **File Upload**: Direct file upload instead of URL-based
2. **Document Preview**: In-browser document viewing
3. **Version Control**: Document versioning system
4. **Permissions**: User-based access control
5. **Search**: Full-text search across documents
6. **Categories**: Custom document categories per customer
7. **Batch Upload**: Multiple document upload
8. **File Storage**: Integration with cloud storage (AWS S3, etc.)

## Development Notes

### Code Organization
- **Frontend**: React components with TypeScript
- **Backend**: Express.js with structured routing
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod schemas for type safety
- **Styling**: Tailwind CSS with shadcn/ui components

### Best Practices
- Always validate data on both frontend and backend
- Use TypeScript interfaces for type safety
- Implement proper error handling and user feedback
- Keep database operations in dedicated service layers
- Use transaction handling for complex operations

---

**Last Updated**: May 29, 2025
**Status**: Fully Functional ✅
**Test Status**: All API tests passing ✅
