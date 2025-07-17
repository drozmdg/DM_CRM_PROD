# Process Enhancement Plan: File Transfer & Notification Features

## Overview
This document outlines the plan to enhance the Process functionality with:
1. File transfer configurations (SFTP, ADLS, S3, etc.)
2. Notification lists for process events

## Phase 1: Data Model Design

### File Transfer Configuration
```typescript
interface ProcessFileTransfer {
  id: string;
  processId: string;
  direction: 'inbound' | 'outbound';
  connectionType: 'SFTP' | 'ADLS' | 'S3' | 'FTP' | 'HTTP' | 'Local';
  
  // Connection details (encrypted in DB)
  connectionConfig: {
    host?: string;
    port?: number;
    username?: string;
    passwordRef?: string; // Reference to secure credential store
    containerName?: string; // For ADLS
    bucketName?: string; // For S3
    region?: string; // For S3
    basePath?: string;
  };
  
  // File details
  filePattern?: string; // e.g., "*.csv", "report_*.xml"
  sourcePath: string;
  destinationPath?: string;
  
  // Schedule
  scheduleType: 'manual' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  scheduleConfig?: {
    hour?: number;
    minute?: number;
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
  
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Notification Configuration
```typescript
interface ProcessNotification {
  id: string;
  processId: string;
  
  // Notification recipient
  recipientName: string;
  recipientEmail: string;
  recipientRole?: string; // e.g., "File Provider", "Data Consumer"
  
  // When to notify
  notifyOn: {
    fileReceived?: boolean;
    fileDelivered?: boolean;
    processStarted?: boolean;
    processCompleted?: boolean;
    processError?: boolean;
    approvalRequired?: boolean;
    approvalReceived?: boolean;
  };
  
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## Phase 2: Database Schema Updates

### New Tables
```sql
-- File Transfer Configuration
CREATE TABLE process_file_transfers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  process_id UUID REFERENCES processes(id) ON DELETE CASCADE,
  direction VARCHAR(10) CHECK (direction IN ('inbound', 'outbound')),
  connection_type VARCHAR(20) CHECK (connection_type IN ('SFTP', 'ADLS', 'S3', 'FTP', 'HTTP', 'Local')),
  connection_config JSONB NOT NULL,
  file_pattern VARCHAR(255),
  source_path VARCHAR(1000) NOT NULL,
  destination_path VARCHAR(1000),
  schedule_type VARCHAR(20) CHECK (schedule_type IN ('manual', 'hourly', 'daily', 'weekly', 'monthly')),
  schedule_config JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Process Notifications
CREATE TABLE process_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  process_id UUID REFERENCES processes(id) ON DELETE CASCADE,
  recipient_name VARCHAR(255) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_role VARCHAR(100),
  notify_on JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_process_file_transfers_process_id ON process_file_transfers(process_id);
CREATE INDEX idx_process_file_transfers_active ON process_file_transfers(is_active);
CREATE INDEX idx_process_notifications_process_id ON process_notifications(process_id);
CREATE INDEX idx_process_notifications_email ON process_notifications(recipient_email);
```

## Phase 3: Implementation Plan

### Backend Updates

#### 1. Update Process Service
- Add methods for managing file transfers
- Add methods for managing notifications
- Update process retrieval to include these relationships

#### 2. Create New Services
- `FileTransferService` - Handle CRUD operations for file transfers
- `NotificationService` - Handle CRUD operations for notifications

#### 3. API Endpoints
```
# File Transfer Endpoints
GET    /api/processes/:processId/file-transfers
POST   /api/processes/:processId/file-transfers
PUT    /api/processes/:processId/file-transfers/:transferId
DELETE /api/processes/:processId/file-transfers/:transferId

# Notification Endpoints
GET    /api/processes/:processId/notifications
POST   /api/processes/:processId/notifications
PUT    /api/processes/:processId/notifications/:notificationId
DELETE /api/processes/:processId/notifications/:notificationId
```

### Frontend Updates

#### 1. Create New Components
- `ProcessFileTransferConfig` - UI for configuring file transfers
- `ProcessNotificationList` - UI for managing notification recipients
- `ConnectionConfigForm` - Form for different connection types

#### 2. Update Process Modal
- Add new tabs for "File Transfer" and "Notifications"
- Integrate new components

#### 3. Update Process Details Page
- Display file transfer configurations
- Display notification recipients
- Allow inline editing

## Phase 4: Security Considerations

### Credential Management
- Never store passwords in plain text
- Use reference IDs to secure credential store
- Implement proper encryption for sensitive connection details

### Access Control
- Limit who can view/edit connection configurations
- Audit trail for configuration changes

## Phase 5: UI Mockups

### File Transfer Tab
```
[File Transfer Configuration]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Direction: [Inbound ▼]    Type: [SFTP ▼]    [+ Add Transfer]

┌─ Transfer 1: Inbound SFTP ─────────────────────[Edit][Delete]─┐
│ Host: sftp.client.com:22                                       │
│ Path: /data/exports/daily_*.csv                               │
│ Schedule: Daily at 2:00 AM                                    │
│ Status: ● Active                                              │
└────────────────────────────────────────────────────────────────┘

┌─ Transfer 2: Outbound S3 ──────────────────────[Edit][Delete]─┐
│ Bucket: client-data-bucket                                     │
│ Path: /processed/reports/                                     │
│ Schedule: After process completion                            │
│ Status: ● Active                                              │
└────────────────────────────────────────────────────────────────┘
```

### Notifications Tab
```
[Process Notifications]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                                        [+ Add Recipient]

┌─ Notifications List ──────────────────────────────────────────┐
│ Name              Email                    Notify On          │
│ ─────────────────────────────────────────────────────────── │
│ John Smith        john@client.com         ☑ File Received    │
│ Data Provider                             ☑ Process Complete │
│                                          ☐ Errors           │
│                                                    [Remove] │
│ ─────────────────────────────────────────────────────────── │
│ Jane Doe          jane@internal.com      ☑ File Delivered   │
│ Project Manager                          ☑ Approval Required│
│                                          ☑ Process Complete │
│                                                    [Remove] │
└────────────────────────────────────────────────────────────────┘
```

## Implementation Timeline

1. **Week 1**: Database schema and backend services
2. **Week 2**: API endpoints and validation
3. **Week 3**: Frontend components
4. **Week 4**: Integration and testing

## Testing Strategy

1. Unit tests for new services
2. Integration tests for API endpoints
3. E2E tests for UI workflows
4. Security testing for credential handling