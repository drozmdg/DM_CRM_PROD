# Contact Management System Documentation

## Overview

The DM_CRM Contact Management System provides comprehensive contact tracking with support for both customer-specific contacts and internal company contacts that can be assigned to multiple customers.

## Contact Types

### 1. Client Contacts
- **Purpose**: Direct customer contacts (employees, stakeholders)
- **Relationship**: One-to-one with a specific customer
- **Database**: Stored with `customer_id` field populated
- **Use Case**: Customer employees, primary contacts, decision makers

### 2. Internal Contacts
- **Purpose**: Company employees who work with multiple customers
- **Relationship**: Many-to-many with customers via assignment system
- **Database**: Stored with `customer_id = null`, assignments in `contact_customer_assignments` table
- **Use Case**: Account managers, consultants, project managers, support staff

## Database Schema

### Primary Tables

#### `contacts` Table
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id), -- NULL for Internal contacts
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(255),
  role VARCHAR(255),
  type VARCHAR(50) DEFAULT 'Client', -- 'Client' or 'Internal'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `contact_customer_assignments` Table
```sql
CREATE TABLE contact_customer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(contact_id, customer_id)
);
```

### Key Design Decisions

1. **Nullable Customer ID**: Internal contacts have `customer_id = null` to enable many-to-many relationships
2. **Junction Table**: `contact_customer_assignments` manages Internal contact assignments
3. **Type Enforcement**: Only Internal contacts can be assigned to multiple customers
4. **Legacy Migration**: Automatic migration of existing Internal contacts from direct customer assignment to junction table

## API Endpoints

### Contact Management
- `GET /api/contacts` - Get all contacts
- `GET /api/contacts?customerId={id}` - Get contacts for a specific customer (includes assigned internal contacts)
- `POST /api/contacts` - Create a new contact
- `PUT /api/contacts/:id` - Update a contact
- `DELETE /api/contacts/:id` - Delete a contact

### Internal Contact Assignment
- `GET /api/contacts/internal` - Get all internal contacts
- `GET /api/contacts/:contactId/assignments` - Get customer assignments for an internal contact
- `POST /api/contacts/:contactId/assign/:customerId` - Assign internal contact to customer
- `DELETE /api/contacts/:contactId/assign/:customerId` - Unassign internal contact from customer

## Components

### Core Components

#### `InternalContactManager`
**Location**: `/client/src/components/InternalContactManager.tsx`

**Purpose**: Manages internal contact assignments for a specific customer

**Features**:
- Lists currently assigned internal contacts
- Provides assignment interface for unassigned internal contacts  
- Handles assignment/unassignment operations
- Real-time updates via React Query
- Error handling and user feedback

**Key Props**:
```typescript
interface InternalContactManagerProps {
  customerId: string;
  customerName: string;
}
```

#### `ContactModal`
**Location**: `/client/src/components/ContactModal.tsx`

**Purpose**: Create and edit contacts

**Features**:
- Contact type selection (Client/Internal)
- Form validation
- Customer assignment for Client contacts
- Consistent styling with application theme

## React Query Integration

### Query Keys
- `['contacts', customerId]` - Contacts for a specific customer
- `['internal-contacts']` - All internal contacts
- `['contact-assignments', contactId]` - Assignments for an internal contact

### Invalidation Strategy
When internal contact assignments change, the following queries are invalidated:
- Customer-specific contact list
- Internal contacts list
- Contact assignments (if applicable)

## Implementation Details

### Legacy Migration
The system automatically migrates legacy internal contacts when they are first assigned:

```typescript
// If internal contact has customer_id (legacy), migrate to assignment table
if (contact.customer_id) {
  // Create assignment record
  await supabase
    .from('contact_customer_assignments')
    .insert({
      contact_id: contactId,
      customer_id: contact.customer_id,
      assigned_at: new Date().toISOString()
    });
  
  // Clear legacy customer_id
  await supabase
    .from('contacts')
    .update({ customer_id: null })
    .eq('id', contactId);
}
```

### Contact Filtering Logic
When retrieving contacts for a customer, the system fetches:
1. **Direct contacts**: Contacts with `customer_id = customerId`
2. **Assigned internal contacts**: Internal contacts linked via assignment table

```typescript
const [directContacts, assignedContacts] = await Promise.all([
  // Direct contacts
  supabase
    .from('contacts')
    .select('*')
    .eq('customer_id', customerId),
  // Internal contacts assigned to this customer
  supabase
    .from('contact_customer_assignments')
    .select('contact_id, contacts!inner(*)')
    .eq('customer_id', customerId)
    .eq('contacts.type', 'Internal')
]);
```

## Usage Examples

### Creating Client Contact
```typescript
const newContact = {
  name: "John Smith",
  email: "john@example.com",
  title: "CTO",
  type: "Client",
  customerId: "customer-uuid"
};

await contactApi.create(newContact);
```

### Creating Internal Contact
```typescript
const internalContact = {
  name: "Jane Doe",
  email: "jane@company.com",
  title: "Account Manager",
  type: "Internal"
  // No customerId - will be null
};

await contactApi.create(internalContact);
```

### Assigning Internal Contact
```typescript
// Assign internal contact to customer
await apiRequest('POST', `/api/contacts/${contactId}/assign/${customerId}`);

// Unassign internal contact from customer
await apiRequest('DELETE', `/api/contacts/${contactId}/assign/${customerId}`);
```

## User Interface

### Customer Profile View
In the customer profile, internal contacts are displayed in a dedicated "Internal Contacts" section:
- Shows currently assigned internal contacts
- "Assign Internal Contact" button to add new assignments
- Unassign button for each assigned contact
- Helpful tooltips and status messages

### Contact Creation
Contact type is selected during creation:
- **Client**: Requires customer selection
- **Internal**: No customer assignment (handled via assignment system)

## Data Integrity

### Constraints
- Internal contacts cannot have a direct `customer_id` 
- Assignment table prevents duplicate assignments via UNIQUE constraint
- Cascade deletes maintain referential integrity

### Validation
- Only Internal contacts can be assigned to multiple customers
- API validates contact type before allowing assignments
- UI prevents invalid operations (e.g., trying to assign Client contact)

## Performance Considerations

### Query Optimization
- Indexes on `customer_id`, `type`, and assignment table foreign keys
- Efficient joins for fetching customer contacts with assignments
- React Query caching reduces redundant API calls

### UI Responsiveness
- Optimistic updates for assignment operations
- Loading states during API calls
- Error boundaries for graceful error handling

## Best Practices

### Contact Management
1. **Use Internal contacts** for company employees who work with multiple customers
2. **Use Client contacts** for customer-specific contacts
3. **Migrate legacy data** automatically rather than manual conversion
4. **Validate assignments** to ensure only Internal contacts are assigned to multiple customers

### Development
1. **Invalidate queries** after assignment changes to ensure UI consistency
2. **Handle errors gracefully** with user-friendly messages
3. **Use TypeScript** for type safety across API boundaries
4. **Test edge cases** like duplicate assignments and invalid operations

## Troubleshooting

### Common Issues

#### "Assign Internal Contact" Button Disabled
**Symptom**: Button appears grayed out despite having internal contacts
**Cause**: API call formatting issue - missing HTTP method parameter
**Solution**: Ensure `apiRequest('GET', '/api/contacts/internal')` format is used

#### Internal Contacts Not Appearing
**Symptom**: API returns 0 internal contacts despite having them in database
**Solution**: Check contact `type` field is exactly 'Internal' (case-sensitive)

#### Assignment Fails
**Symptom**: Error when trying to assign internal contact
**Causes**: 
- Contact is not Internal type
- Assignment already exists
- Invalid customer or contact ID
**Solution**: Verify contact type and check for existing assignments

## Future Enhancements

### Potential Improvements
1. **Bulk Assignment**: Assign multiple internal contacts to customer at once
2. **Assignment History**: Track when contacts were assigned/unassigned
3. **Role-Based Permissions**: Different access levels for contact management
4. **Contact Hierarchy**: Manager/subordinate relationships
5. **Integration**: Sync with external contact systems (Outlook, Salesforce)

## Related Documentation
- [CLAUDE.md](./CLAUDE.md) - Main project documentation
- [README.md](./README.md) - Project overview and setup
- [CURRENT_STATUS.md](./CURRENT_STATUS.md) - Current implementation status