# New Feature Implementation Tasks

## Overview
Implementation tasks for adding Customer Notes and Important Dates features to the Sales Dashboard CRM.

**Features to implement:**
1. **Customer Notes** - Timestamped notes associated with customers
2. **Important Dates** - Key dates like renewals, anniversaries for customers

**Note:** Authentication is disabled as this is a local application.

---

## Phase 1: Database Schema Creation

### Task 1.1: Create Database Tables in Supabase
**Location:** Supabase Dashboard SQL Editor
**Status:** [ ] Not Started

Execute the following SQL script in Supabase:

```sql
-- Create customer_notes table
CREATE TABLE public.customer_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    note_content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create customer_important_dates table  
CREATE TABLE public.customer_important_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    description VARCHAR(256) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add indexes for performance
CREATE INDEX idx_customer_notes_customer_id ON customer_notes(customer_id);
CREATE INDEX idx_customer_notes_created_at ON customer_notes(created_at);
CREATE INDEX idx_customer_important_dates_customer_id ON customer_important_dates(customer_id);
CREATE INDEX idx_customer_important_dates_date ON customer_important_dates(date);

-- Add update triggers
CREATE TRIGGER update_customer_notes_updated_at 
    BEFORE UPDATE ON customer_notes 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_customer_important_dates_updated_at 
    BEFORE UPDATE ON customer_important_dates 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Add table comments
COMMENT ON TABLE public.customer_notes IS 'Stores dated notes related to a specific customer';
COMMENT ON TABLE public.customer_important_dates IS 'Tracks important dates for a customer like renewals or anniversaries';
```

**Success Criteria:**
- [ ] Tables created successfully in Supabase
- [ ] Indexes created
- [ ] Update triggers working
- [ ] Foreign key relationships established

---

## Phase 2: Type Definitions

### Task 2.1: Add Type Interfaces
**File:** `shared/types/index.ts`
**Status:** [ ] Not Started

Add the following interfaces to the existing types file:

```typescript
// Customer Note interface
export interface CustomerNote {
  id: string;
  customerId: string;
  noteContent: string;
  createdAt: string;
  updatedAt: string;
}

// Customer Important Date interface
export interface CustomerImportantDate {
  id: string;
  customerId: string;
  description: string;
  date: string; // Format: YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}
```

**Success Criteria:**
- [ ] Interfaces added to shared types
- [ ] No TypeScript errors
- [ ] Types exported properly

---

## Phase 3: Backend Service Layer

### Task 3.1: Create Note Service
**File:** `server/lib/database/noteService.ts`
**Status:** [ ] Not Started

Create new service file with the following structure:

```typescript
import { supabase } from '../supabase.js';
import type { CustomerNote, CustomerImportantDate } from '../../../shared/types/index.js';

export class NoteService {
  // Customer Notes methods
  async getNotesByCustomerId(customerId: string): Promise<CustomerNote[]> {
    const { data, error } = await supabase
      .from('customer_notes')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async createNote(customerId: string, noteContent: string): Promise<CustomerNote> {
    const { data, error } = await supabase
      .from('customer_notes')
      .insert({ customer_id: customerId, note_content: noteContent })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateNote(id: string, noteContent: string): Promise<CustomerNote> {
    const { data, error } = await supabase
      .from('customer_notes')
      .update({ note_content: noteContent })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteNote(id: string): Promise<void> {
    const { error } = await supabase
      .from('customer_notes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Important Dates methods
  async getImportantDatesByCustomerId(customerId: string): Promise<CustomerImportantDate[]> {
    const { data, error } = await supabase
      .from('customer_important_dates')
      .select('*')
      .eq('customer_id', customerId)
      .order('date', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  async createImportantDate(customerId: string, description: string, date: string): Promise<CustomerImportantDate> {
    const { data, error } = await supabase
      .from('customer_important_dates')
      .insert({ customer_id: customerId, description, date })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateImportantDate(id: string, description: string, date: string): Promise<CustomerImportantDate> {
    const { data, error } = await supabase
      .from('customer_important_dates')
      .update({ description, date })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteImportantDate(id: string): Promise<void> {
    const { error } = await supabase
      .from('customer_important_dates')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

export const noteService = new NoteService();
```

**Success Criteria:**
- [ ] Service class created with all CRUD methods
- [ ] Proper error handling
- [ ] TypeScript types correctly imported
- [ ] Service instance exported

---

## Phase 4: API Routes

### Task 4.1: Add Note and Date Routes
**File:** `server/routes.ts`
**Status:** [ ] Not Started

Add the following routes to the existing routes file:

```typescript
// Import the note service
import { noteService } from "./lib/database/noteService.js";

// Customer Notes Routes
app.get("/api/customers/:customerId/notes", async (req, res) => {
  try {
    const notes = await noteService.getNotesByCustomerId(req.params.customerId);
    res.json(notes);
  } catch (error) {
    console.error("Error fetching customer notes:", error);
    res.status(500).json({ message: "Failed to fetch customer notes" });
  }
});

app.post("/api/customers/:customerId/notes", async (req, res) => {
  try {
    const { noteContent } = req.body;
    if (!noteContent) {
      return res.status(400).json({ message: "Note content is required" });
    }
    const note = await noteService.createNote(req.params.customerId, noteContent);
    res.status(201).json(note);
  } catch (error) {
    console.error("Error creating customer note:", error);
    res.status(500).json({ message: "Failed to create customer note" });
  }
});

app.put("/api/customers/notes/:id", async (req, res) => {
  try {
    const { noteContent } = req.body;
    if (!noteContent) {
      return res.status(400).json({ message: "Note content is required" });
    }
    const note = await noteService.updateNote(req.params.id, noteContent);
    res.json(note);
  } catch (error) {
    console.error("Error updating customer note:", error);
    res.status(500).json({ message: "Failed to update customer note" });
  }
});

app.delete("/api/customers/notes/:id", async (req, res) => {
  try {
    await noteService.deleteNote(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting customer note:", error);
    res.status(500).json({ message: "Failed to delete customer note" });
  }
});

// Important Dates Routes
app.get("/api/customers/:customerId/important-dates", async (req, res) => {
  try {
    const dates = await noteService.getImportantDatesByCustomerId(req.params.customerId);
    res.json(dates);
  } catch (error) {
    console.error("Error fetching important dates:", error);
    res.status(500).json({ message: "Failed to fetch important dates" });
  }
});

app.post("/api/customers/:customerId/important-dates", async (req, res) => {
  try {
    const { description, date } = req.body;
    if (!description || !date) {
      return res.status(400).json({ message: "Description and date are required" });
    }
    const importantDate = await noteService.createImportantDate(
      req.params.customerId, 
      description, 
      date
    );
    res.status(201).json(importantDate);
  } catch (error) {
    console.error("Error creating important date:", error);
    res.status(500).json({ message: "Failed to create important date" });
  }
});

app.put("/api/customers/important-dates/:id", async (req, res) => {
  try {
    const { description, date } = req.body;
    if (!description || !date) {
      return res.status(400).json({ message: "Description and date are required" });
    }
    const importantDate = await noteService.updateImportantDate(
      req.params.id,
      description,
      date
    );
    res.json(importantDate);
  } catch (error) {
    console.error("Error updating important date:", error);
    res.status(500).json({ message: "Failed to update important date" });
  }
});

app.delete("/api/customers/important-dates/:id", async (req, res) => {
  try {
    await noteService.deleteImportantDate(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting important date:", error);
    res.status(500).json({ message: "Failed to delete important date" });
  }
});
```

**Success Criteria:**
- [ ] All CRUD endpoints created for notes
- [ ] All CRUD endpoints created for important dates
- [ ] Proper error handling and validation
- [ ] Correct HTTP status codes

---

## Phase 5: Frontend API Client

### Task 5.1: Extend API Client
**File:** `client/src/lib/api.ts`
**Status:** [ ] Not Started

Add the following API functions:

```typescript
// Customer Notes API
export const customerNotesApi = {
  getAll: async (customerId: string) => {
    const response = await apiRequest("GET", `/api/customers/${customerId}/notes`);
    return response.json();
  },
  
  create: async (customerId: string, noteContent: string) => {
    const response = await apiRequest("POST", `/api/customers/${customerId}/notes`, { noteContent });
    return response.json();
  },
  
  update: async (id: string, noteContent: string) => {
    const response = await apiRequest("PUT", `/api/customers/notes/${id}`, { noteContent });
    return response.json();
  },
  
  delete: async (id: string) => {
    await apiRequest("DELETE", `/api/customers/notes/${id}`);
  },
};

// Important Dates API
export const importantDatesApi = {
  getAll: async (customerId: string) => {
    const response = await apiRequest("GET", `/api/customers/${customerId}/important-dates`);
    return response.json();
  },
  
  create: async (customerId: string, description: string, date: string) => {
    const response = await apiRequest("POST", `/api/customers/${customerId}/important-dates`, { 
      description, 
      date 
    });
    return response.json();
  },
  
  update: async (id: string, description: string, date: string) => {
    const response = await apiRequest("PUT", `/api/customers/important-dates/${id}`, { 
      description, 
      date 
    });
    return response.json();
  },
  
  delete: async (id: string) => {
    await apiRequest("DELETE", `/api/customers/important-dates/${id}`);
  },
};
```

**Success Criteria:**
- [ ] API client functions created
- [ ] Proper TypeScript types
- [ ] Consistent with existing API patterns

---

## Phase 6: Frontend Components

### Task 6.1: Create Customer Notes Component
**File:** `client/src/components/CustomerNotes.tsx`
**Status:** [ ] Not Started

Create component with:
- List view of notes
- Add new note form
- Edit/Delete functionality
- Uses TanStack Query for data management

### Task 6.2: Create Important Dates Component
**File:** `client/src/components/CustomerImportantDates.tsx`
**Status:** [ ] Not Started

Create component with:
- List view of important dates
- Add new date form
- Edit/Delete functionality
- Date picker integration
- Uses TanStack Query for data management

### Task 6.3: Create React Query Hooks
**File:** `client/src/hooks/useCustomerNotes.ts`
**Status:** [ ] Not Started

Create custom hooks:
```typescript
export const useCustomerNotes = (customerId: string) => {
  return useQuery({
    queryKey: ['customerNotes', customerId],
    queryFn: () => customerNotesApi.getAll(customerId),
    enabled: !!customerId,
  });
};

export const useCreateCustomerNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ customerId, noteContent }: { customerId: string; noteContent: string }) => 
      customerNotesApi.create(customerId, noteContent),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customerNotes', variables.customerId] });
    },
  });
};

// Similar hooks for update, delete, and important dates...
```

**Success Criteria:**
- [ ] All hooks created with proper typing
- [ ] Query invalidation on mutations
- [ ] Error handling

---

## Phase 7: Integration

### Task 7.1: Add Components to Customer Profile
**File:** `client/src/pages/CustomerProfile.tsx`
**Status:** [ ] Not Started

Add tabs or sections for:
- Customer Notes
- Important Dates

### Task 7.2: Update Customer Type (if needed)
**File:** `shared/types/index.ts`
**Status:** [ ] Not Started

If needed, update Customer interface to include optional arrays:
```typescript
export interface Customer {
  // ... existing fields
  notes?: CustomerNote[];
  importantDates?: CustomerImportantDate[];
}
```

**Success Criteria:**
- [ ] Components integrated into customer profile
- [ ] Proper layout and styling
- [ ] Data loads correctly

---

## Phase 8: Testing & Verification

### Task 8.1: Manual Testing Checklist
**Status:** [ ] Not Started

**Customer Notes:**
- [ ] Create a new note
- [ ] View list of notes (sorted by date)
- [ ] Edit an existing note
- [ ] Delete a note
- [ ] Verify timestamps update correctly

**Important Dates:**
- [ ] Create a new important date
- [ ] View list of dates (sorted chronologically)
- [ ] Edit an existing date
- [ ] Delete a date
- [ ] Verify date picker works correctly

**Integration:**
- [ ] Notes persist after page refresh
- [ ] Dates persist after page refresh
- [ ] Foreign key cascade delete works (delete customer removes notes/dates)
- [ ] No console errors
- [ ] Loading states display correctly
- [ ] Error states handle gracefully

### Task 8.2: Type Checking
**Status:** [ ] Not Started

Run TypeScript type checking:
```bash
npm run check
```

**Success Criteria:**
- [ ] No TypeScript errors
- [ ] All new code properly typed

---

## Phase 9: Documentation

### Task 9.1: Update README.md
**File:** `README.md`
**Status:** [ ] Not Started

Add to features list:
- Customer Notes management
- Important Dates tracking

Add new API endpoints to documentation.

### Task 9.2: Update CLAUDE.md
**File:** `CLAUDE.md`
**Status:** [ ] Not Started

Add information about:
- New database tables
- New service layer
- New API endpoints
- New components

**Success Criteria:**
- [ ] Documentation updated
- [ ] API routes documented
- [ ] Feature list updated

---

## Completion Checklist

- [ ] Database tables created and verified
- [ ] Backend service layer implemented
- [ ] API routes tested with Postman/curl
- [ ] Frontend components render correctly
- [ ] Data persistence verified
- [ ] No TypeScript errors
- [ ] Documentation updated
- [ ] Manual testing completed
- [ ] Code committed to repository

## Notes

- Remember: No authentication is required as this is a local application
- Follow existing code patterns and conventions
- Use existing UI components from Shadcn/UI where possible
- Maintain consistent error handling patterns