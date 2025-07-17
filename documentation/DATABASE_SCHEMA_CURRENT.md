# Database Schema - Current Implementation

This document provides a detailed breakdown of the current database schema for the Sales Dashboard application based on the actual Drizzle ORM implementation in `shared/schema.ts`.

## Table of Contents

1. [Overview](#overview)
2. [Tables](#tables)
   - [users](#users)
   - [sessions](#sessions)
   - [customers](#customers)
   - [contacts](#contacts)
   - [teams](#teams)
   - [services](#services)
   - [processes](#processes)
   - [documents](#documents)
   - [timeline_events](#timeline_events)
   - [communications](#communications)
   - [ai_chat_sessions](#ai_chat_sessions)
   - [ai_chat_messages](#ai_chat_messages)
3. [Relationships](#relationships)
4. [Data Types](#data-types)

---

## Overview

The current implementation uses Drizzle ORM with PostgreSQL (via Supabase). The schema uses text-based primary keys and string enums rather than PostgreSQL native ENUMs. This provides flexibility while maintaining type safety through TypeScript.

**Key Architecture Decisions:**
- Primary keys are text-based (not UUIDs or serial integers)
- Enums are implemented as text fields with TypeScript type checking
- No authentication system is currently implemented (users table exists but unused)
- Foreign key relationships use CASCADE DELETE where appropriate

---

## Tables

### `users`
User accounts for the application. **Currently not used for authentication.**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `varchar` | `PRIMARY KEY` | Unique identifier for the user |
| `email` | `varchar` | `UNIQUE` | User's email address |
| `first_name` | `varchar` | | User's first name |
| `last_name` | `varchar` | | User's last name |
| `profile_image_url` | `varchar` | | URL to user's profile image |
| `created_at` | `timestamp` | `DEFAULT NOW()` | Record creation timestamp |
| `updated_at` | `timestamp` | `DEFAULT NOW()` | Last update timestamp |

### `sessions`
Session storage for authentication (currently unused).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `sid` | `varchar` | `PRIMARY KEY` | Session identifier |
| `sess` | `jsonb` | `NOT NULL` | Session data |
| `expire` | `timestamp` | `NOT NULL` | Session expiration time |

**Indexes:** `IDX_session_expire` on `expire`

### `customers`
Primary information about client companies.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `text` | `PRIMARY KEY` | Unique identifier |
| `name` | `text` | `NOT NULL` | Company name |
| `phase` | `text` | `NOT NULL` | Customer lifecycle phase |
| `contract_start_date` | `date` | | Contract start date |
| `contract_end_date` | `date` | | Contract end date |
| `logo_url` | `text` | | URL to company logo |
| `avatar_color` | `text` | `DEFAULT '#1976D2'` | Hex color for UI avatars |
| `active` | `boolean` | `DEFAULT true` | Soft delete flag |
| `inactivated_at` | `timestamp` | | When customer was deactivated |
| `created_at` | `timestamp` | `DEFAULT NOW()` | Record creation timestamp |
| `updated_at` | `timestamp` | `DEFAULT NOW()` | Last update timestamp |

**Valid phases:** `'Contracting'`, `'New Activation'`, `'Steady State'`, `'Steady State + New Activation'`, `'Pending Termination'`, `'Terminated'`

### `contacts`
Contact information for individuals associated with customers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `text` | `PRIMARY KEY` | Unique identifier |
| `customer_id` | `text` | `REFERENCES customers(id)` | Associated customer |
| `name` | `text` | `NOT NULL` | Contact's full name |
| `title` | `text` | | Job title |
| `email` | `text` | `NOT NULL` | Email address |
| `phone` | `text` | | Phone number |
| `role` | `text` | | Role in relation to projects |
| `type` | `text` | `NOT NULL` | Contact type |
| `created_at` | `timestamp` | `DEFAULT NOW()` | Record creation timestamp |

**Valid types:** `'Client'`, `'Internal'`

### `teams`
Teams within client organizations that are managed.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `text` | `PRIMARY KEY` | Unique identifier |
| `name` | `text` | `NOT NULL` | Team name |
| `finance_code` | `text` | `NOT NULL` | Internal finance code |
| `customer_id` | `text` | `REFERENCES customers(id)` | Associated customer |
| `start_date` | `date` | | Team management start date |
| `end_date` | `date` | | Team management end date |
| `created_at` | `timestamp` | `DEFAULT NOW()` | Record creation timestamp |

### `services`
Services contracted by customers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `text` | `PRIMARY KEY` | Unique identifier |
| `customer_id` | `text` | `REFERENCES customers(id)` | Associated customer |
| `name` | `text` | `NOT NULL` | Service name |
| `monthly_hours` | `integer` | `NOT NULL` | Monthly hours allocated |
| `created_at` | `timestamp` | `DEFAULT NOW()` | Record creation timestamp |

### `processes`
Technical processes required to support clients.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `text` | `PRIMARY KEY` | Unique identifier |
| `name` | `text` | `NOT NULL` | Process name |
| `description` | `text` | | Detailed description |
| `customer_id` | `text` | `REFERENCES customers(id)` | Associated customer |
| `jira_ticket` | `text` | | Corresponding Jira ticket |
| `status` | `text` | `NOT NULL` | Current status |
| `sdlc_stage` | `text` | `NOT NULL` | SDLC stage |
| `start_date` | `date` | `NOT NULL` | Process start date |
| `due_date` | `date` | | Expected completion date |
| `approval_status` | `text` | `DEFAULT 'Pending'` | Approval status |
| `estimate` | `integer` | | Estimated hours |
| `functional_area` | `text` | | Functional area |
| `responsible_contact_id` | `text` | `REFERENCES contacts(id)` | Responsible contact |
| `progress` | `integer` | `DEFAULT 0` | Progress percentage (0-100) |
| `is_tpa_required` | `boolean` | `DEFAULT FALSE` | Whether TPA is required |
| `tpa_responsible_contact_id` | `text` | `REFERENCES contacts(id)` | TPA responsible contact |
| `tpa_data_source` | `text` | | Name of data source governed by TPA |
| `tpa_start_date` | `date` | | TPA agreement start date |
| `tpa_end_date` | `date` | | TPA agreement end date |
| `created_at` | `timestamp` | `DEFAULT NOW()` | Record creation timestamp |
| `updated_at` | `timestamp` | `DEFAULT NOW()` | Last update timestamp |

**Valid statuses:** `'Not Started'`, `'In Progress'`, `'Completed'`

**Valid SDLC stages:** `'Requirements'`, `'Design'`, `'Development'`, `'Testing'`, `'Deployment'`, `'Maintenance'`

**Valid approval statuses:** `'Pending'`, `'Approved'`, `'Rejected'`, `'Not Required'`

**Valid functional areas:** `'Standard Data Ingestion'`, `'Custom Data Ingestion'`, `'Standard Extract'`, `'Custom Extract'`, `'CRM Refresh'`, `'New Team Implementation'`

### `documents`
Document metadata associated with customers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `text` | `PRIMARY KEY` | Unique identifier |
| `customer_id` | `text` | `REFERENCES customers(id)` | Associated customer |
| `name` | `text` | `NOT NULL` | Document name |
| `description` | `text` | | Document description |
| `category` | `text` | `NOT NULL` | Document category |
| `file_url` | `text` | `NOT NULL` | File storage URL |
| `file_size` | `integer` | | File size in bytes |
| `mime_type` | `text` | | MIME type |
| `uploaded_at` | `timestamp` | `DEFAULT NOW()` | Upload timestamp |

**Valid categories:** `'Contract'`, `'Proposal'`, `'Requirements'`, `'Design'`, `'Technical'`, `'Report'`, `'Invoice'`, `'Other'`

### `timeline_events`
Key events and milestones for customers and processes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `text` | `PRIMARY KEY` | Unique identifier |
| `customer_id` | `text` | `REFERENCES customers(id)` | Associated customer (optional) |
| `process_id` | `text` | `REFERENCES processes(id)` | Associated process (optional) |
| `event_type` | `text` | `NOT NULL` | Type of event |
| `title` | `text` | `NOT NULL` | Event title |
| `description` | `text` | | Event description |
| `metadata` | `jsonb` | | Additional event data |
| `created_at` | `timestamp` | `DEFAULT NOW()` | Event timestamp |

**Common event types:** `'customer_created'`, `'process_started'`, `'document_uploaded'`, `'process_completed'`

### `communications`
Communication history with contacts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `text` | `PRIMARY KEY` | Unique identifier |
| `contact_id` | `text` | `REFERENCES contacts(id)` | Associated contact |
| `type` | `text` | `NOT NULL` | Communication method |
| `subject` | `text` | `NOT NULL` | Subject/title |
| `notes` | `text` | `NOT NULL` | Detailed notes |
| `date` | `text` | `NOT NULL` | Communication date |
| `created_at` | `timestamp` | `DEFAULT NOW()` | Record creation timestamp |

**Valid types:** `'email'`, `'phone'`, `'meeting'`, `'other'`

### `ai_chat_sessions`
AI chat sessions (if AI features are implemented).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `text` | `PRIMARY KEY` | Unique identifier |
| `user_id` | `varchar` | `REFERENCES users(id)` | Session owner |
| `title` | `text` | | Session title |
| `model` | `text` | `DEFAULT 'llama2'` | AI model used |
| `system_prompt` | `text` | | System prompt |
| `created_at` | `timestamp` | `DEFAULT NOW()` | Session creation timestamp |

### `ai_chat_messages`
Individual messages within AI chat sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `text` | `PRIMARY KEY` | Unique identifier |
| `session_id` | `text` | `REFERENCES ai_chat_sessions(id)` | Associated session |
| `role` | `text` | `NOT NULL` | Message sender |
| `content` | `text` | `NOT NULL` | Message content |
| `created_at` | `timestamp` | `DEFAULT NOW()` | Message timestamp |

**Valid roles:** `'user'`, `'assistant'`

---

## Relationships

### One-to-Many Relationships
- `customers` → `contacts`
- `customers` → `services`  
- `customers` → `processes`
- `customers` → `documents`
- `customers` → `timeline_events`
- `contacts` → `communications`
- `contacts` → `processes` (as responsible contact)
- `processes` → `timeline_events`
- `users` → `ai_chat_sessions`
- `ai_chat_sessions` → `ai_chat_messages`

### Foreign Key Constraints
All foreign key relationships use the default `NO ACTION` constraint, meaning related records cannot be deleted if they have dependent records.

---

## Data Types

### Text vs String Enums
The schema uses `text` fields with TypeScript type checking rather than PostgreSQL ENUMs for flexibility:

```typescript
// Example: Process status is enforced at the TypeScript level
type ProcessStatus = 'Not Started' | 'In Progress' | 'Completed';
```

### Timestamps
All timestamps use `timestamp` with default `NOW()` and are timezone-aware.

### JSON Fields
- `sessions.sess`: Session data storage
- `timeline_events.metadata`: Flexible event metadata storage

---

## Migration Notes

If migrating from the legacy UUID-based schema:
1. Convert UUID primary keys to text
2. Remove PostgreSQL ENUMs in favor of text fields
3. Add soft delete fields (`active`, `inactivated_at`) to customers
4. Update foreign key references
5. Add new tables: `timeline_events`, `ai_chat_sessions`, `ai_chat_messages`
