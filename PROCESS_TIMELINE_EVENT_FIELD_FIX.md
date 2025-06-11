# Process Timeline Event Field Fix

## Issue Overview
After fixing the process creation and timeline event ID generation issues, we encountered a 500 Internal Server Error when attempting to create a new process through the UI. The error occurred when the system tried to create an initial timeline event for the new process.

## Root Cause
The `addTimelineEvent` method in `ProcessService` was attempting to insert data with incorrect field names:

1. **Schema Mismatch**: The method was using `event_type` and `title` fields which don't exist in the `process_timeline_events` table
2. **Actual Schema**: The table actually has fields named `stage`, `date`, and `description` based on the schema verification
3. **Missing ID Generation**: The code wasn't explicitly generating an ID for the timeline event record

Error message from server logs:
```
Supabase error creating timeline event: {
  message: "Could not find the 'event_type' column of 'process_timeline_events' in the schema cache",
  details: null,
  hint: null,
  code: 'PGRST204',
  ...
}
```

## Fix Implementation
Modified the `addTimelineEvent` method in `ProcessService.ts` to align with the actual database schema:

### Before:
```typescript
// Safeguard to ensure all required fields are present
const insertData = {
  process_id: processId,
  event_type: event.eventType || 'general',
  title: event.title || 'Event',
  description: event.description || '',
  created_at: event.date || new Date().toISOString()
};
```

### After:
```typescript
// Safeguard to ensure all required fields are present
const insertData = {
  process_id: processId,
  stage: event.eventType || 'general',  // Changed from event_type to stage
  description: event.description || '',
  date: event.date || new Date().toISOString(),
  // Using timestamp for ID to ensure uniqueness
  id: `event-${Date.now()}`
};
```

## Related Changes
1. Updated the debug logging to use the correct field names
2. Modified return object structure to match the actual table fields
3. Updated error handling to use the correct field structure

## Testing
To verify this fix:
1. Create a new process through the UI
2. Check that it completes without errors
3. Verify the initial timeline event is created correctly
4. Verify process creation through the test script: `node verbose-process-test.mjs`

## Related Issues
This issue is related to the previous fixes documented in:
- `TIMELINE_EVENTS_ISSUE_TRACKER.md`
- `PROCESS_CREATION_FIX_DOCUMENTATION.md`
- `PROCESS_TIMELINE_FIX_COMPLETION_REPORT.md`

## Conclusion
This fix ensures proper alignment between the application code and the database schema for process timeline events, resolving the 500 Internal Server Error when creating new processes.

## Date Implemented: June 4, 2025
