# Enhanced Document Management System - Technical Documentation

## Overview

The DM_CRM features a comprehensive document management system with enhanced viewing capabilities, supporting multiple file formats with rich previews and interactive features. The system provides consistent document handling across all application modules with WSL-optimized performance.

## ✨ Features

### 📁 **File Type Support**
- **Office Documents**: Word (.doc, .docx), Excel (.xlsx, .xls), PowerPoint (.ppt, .pptx)
- **Data Files**: CSV files with search and filtering capabilities
- **Code & Text**: SQL, JavaScript, TypeScript, Python, JSON, XML, YAML, CSS, HTML, Markdown, TXT
- **Media Files**: PDF, images (JPG, PNG, GIF, BMP, SVG)
- **Archives**: ZIP, RAR, 7Z (metadata view)

### 🔍 **Rich File Viewing**
- **Word Documents**: Formatted HTML preview with headings, lists, tables, images
- **Excel Spreadsheets**: Interactive table view with sheet navigation and CSV export
- **CSV Files**: Searchable tables with filtering, sorting, and TSV export
- **Code Files**: Syntax highlighting with language detection and copy functionality
- **PDF Files**: Embedded iframe preview with toolbar controls
- **Images**: Full-size preview with error handling

### 🚀 **Interactive Features**
- **Search Within Files**: Find content in CSV and code files
- **Data Export**: Download CSV data as TSV, Excel data as CSV
- **Code Operations**: Copy code snippets, change syntax highlighting language
- **File Operations**: Download original files, open in new tabs
- **Responsive Design**: Mobile-friendly viewing on all devices

## 🏗️ Technical Architecture

### Frontend Components

#### 1. Enhanced DocumentViewer (`/client/src/components/DocumentViewer.tsx`)
**Purpose**: Main document viewing component with unified interface

**Key Features**:
- Automatic file type detection and routing
- Responsive modal design with header controls
- Metadata display (upload date, file size, category)
- Integrated viewer component selection
- Download and external link functionality

#### 2. Specialized Viewer Components

##### WordViewer (`/client/src/components/viewers/WordViewer.tsx`)
- **Library**: Mammoth.js for .doc/.docx conversion
- **Output**: Formatted HTML with preserved styling
- **Features**: Error handling, loading states, responsive layout

##### ExcelViewer (`/client/src/components/viewers/ExcelViewer.tsx`)
- **Library**: XLSX.js for spreadsheet parsing
- **Output**: Interactive HTML tables with sheet navigation
- **Features**: CSV export, row/column counts, sheet selection

##### CsvViewer (`/client/src/components/viewers/CsvViewer.tsx`)
- **Library**: PapaParse for CSV parsing
- **Output**: Searchable table with filtering capabilities
- **Features**: Real-time search, TSV export, row statistics

##### CodeViewer (`/client/src/components/viewers/CodeViewer.tsx`)
- **Library**: React Syntax Highlighter with Prism
- **Output**: Syntax-highlighted code with line numbers
- **Features**: Language detection, manual language selection, copy functionality, dark/light theme support

#### 3. File Processing Utilities (`/client/src/lib/fileParser.ts`)
**Purpose**: Client-side file processing and content extraction

**Key Functions**:
- `fetchFileAsArrayBuffer()`: Binary file retrieval
- `fetchFileAsText()`: Text file retrieval
- `parseWordDocument()`: Word to HTML conversion
- `parseExcelFile()`: Excel to table data
- `parseCsvFile()`: CSV to structured data
- `formatTextContent()`: Text formatting with metadata
- `getFileType()`: File type detection by extension

### Document Upload System

#### 1. Standard DocumentUpload Component (`/client/src/components/DocumentUpload.tsx`)
**Purpose**: Unified document upload interface across all modules

**Features**:
- Drag-and-drop file selection
- Form validation with Zod schemas
- Progress tracking and status updates
- Customer and process association
- Multiple callback support (onClose, onUploadComplete, onSuccess)

#### 2. Integration Points

##### CustomerDocumentManager (`/client/src/components/CustomerDocumentManager.tsx`)
- **Fixed Issues**: Removed complex custom upload form
- **Current Implementation**: Uses standard DocumentUpload with proper modal handling
- **Close Methods**: X button, Cancel button, ESC key, outside click

##### ProcessDocumentManager (`/client/src/components/ProcessDocumentManager.tsx`)
- **Fixed Issues**: Added proper modal close functionality
- **Current Implementation**: Standard DocumentUpload with process association
- **Features**: Document attachment to processes, proper dialog management

##### Main Documents Page (`/client/src/pages/Documents.tsx`)
- **Implementation**: Direct DocumentUpload usage with custom modal
- **Features**: Global document management, search, and categorization

## 🔧 WSL Optimization

### Client-Side Processing
- **File Parsing**: All file processing occurs in the browser to avoid WSL file system bottlenecks
- **Library Selection**: Pure JavaScript libraries that don't require native dependencies
- **Performance**: Reduced server load and faster response times in WSL environments

### Memory Management
- **Streaming**: Large files processed in chunks where possible
- **Cleanup**: Proper cleanup of file objects and memory allocation
- **Error Handling**: Graceful degradation for oversized files

## 📋 Usage Examples

### Document Viewing
```typescript
// Access points - all use same DocumentViewer
1. Documents Tab → Click Eye icon
2. Customer Profile → Documents → Click Eye icon  
3. Process Details → Documents → Click Eye icon
```

### Document Upload
```typescript
// Consistent upload interface
<DocumentUpload
  customerId={customerId}
  processId={processId} // optional
  standalone={true}
  onClose={() => setDialogOpen(false)}
  onUploadComplete={() => {
    setDialogOpen(false);
    refreshDocuments();
  }}
/>
```

### File Type Detection
```typescript
import { getFileType } from '@/lib/fileParser';

const fileType = getFileType('document.xlsx');
// Returns: 'excel'

const supportedTypes = ['word', 'excel', 'csv', 'text', 'unsupported'];
```

## 🎨 Styling and Themes

### CSS Integration (`/client/src/index.css`)
- **Word Content**: Formatted typography with proper spacing
- **Excel Tables**: Zebra striping, sticky headers, responsive columns
- **CSV Tables**: Interactive styling with hover effects
- **Code Highlighting**: Dark/light theme support with proper contrast

### Responsive Design
- **Mobile Support**: Optimized layouts for all screen sizes
- **Touch Interactions**: Proper touch targets and scroll behavior
- **Accessibility**: Keyboard navigation and screen reader support

## 🔍 Testing and Validation

### File Format Testing
- **Word Documents**: Test with complex formatting, tables, images
- **Excel Files**: Multi-sheet workbooks, formulas, charts
- **CSV Files**: Large datasets, special characters, various delimiters
- **Code Files**: Multiple languages, syntax edge cases
- **Error Handling**: Corrupted files, unsupported formats, network issues

### Modal Functionality Testing
- **Close Methods**: Verify all close methods work (X, Cancel, ESC, outside click)
- **Upload Process**: Test complete upload workflow with validation
- **Error States**: Network failures, file size limits, format restrictions

## 🚀 Future Enhancements

### Advanced Features
- **Version Control**: Document versioning with diff views
- **Collaboration**: Real-time editing and commenting
- **Advanced Search**: Full-text search across all documents
- **Thumbnails**: Preview thumbnails for quick identification
- **Bulk Operations**: Multi-file upload and batch processing

### Performance Optimizations
- **Virtual Scrolling**: For large datasets in CSV/Excel viewers
- **Lazy Loading**: Progressive loading of document content
- **Caching**: Client-side caching of parsed content
- **Worker Threads**: Background processing for large files

## 📝 API Endpoints

### Document Operations
- `GET /api/documents` - List all documents
- `GET /api/documents/:id` - Get specific document
- `POST /api/documents` - Upload new document
- `DELETE /api/documents/:id` - Delete document
- `GET /api/customers/:id/documents` - Customer-specific documents
- `GET /api/processes/:id/documents` - Process-specific documents

### File Processing
- Client-side processing eliminates need for server-side file parsing endpoints
- All file content extraction happens in the browser
- Server only handles metadata and file storage

## 🔒 Security Considerations

### File Upload Security
- **File Type Validation**: Server-side MIME type checking
- **Size Limits**: Configurable file size restrictions
- **Sanitization**: Filename sanitization and validation
- **Storage**: Secure file storage with access controls

### Content Security
- **XSS Prevention**: Proper HTML sanitization for Word documents
- **Script Blocking**: No execution of embedded scripts
- **Safe Rendering**: Sandboxed iframe rendering for PDFs

This comprehensive document management system provides a modern, efficient, and user-friendly experience for handling documents across the entire DM_CRM application.