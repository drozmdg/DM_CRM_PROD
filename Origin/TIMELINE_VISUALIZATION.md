# Timeline Visualization

## Overview

The Timeline Visualization module provides a chronological view of events related to customers and processes. This functionality helps users understand the history and progression of customer relationships and specific work items.

## Features

- **Customer Timeline**: Display events related to a customer in chronological order
- **Process Timeline**: Show the progression of a process through SDLC stages
- **Event Categorization**: Visually differentiate between event types
- **Chronological Ordering**: Present events in date order

## Components

### PixelTimeline

A general-purpose timeline component for displaying customer events.

**Location**: `src/components/PixelTimeline.tsx`

**Props**:
- `events`: Array of timeline events to display

**Functionality**:
- Renders a vertical timeline of events
- Displays event date, title, and description
- Uses different visual indicators for different event types
- Orders events chronologically

### ProcessTimeline

A specialized timeline component for visualizing process progression through SDLC stages.

**Location**: `src/components/ProcessTimeline.tsx`

**Props**:
- `events`: Array of process timeline events to display
- `className`: Optional CSS class name
- `status`: Process status ('Not Started', 'In Progress', or 'Completed')

**Functionality**:
- Renders a visually appealing timeline of process events
- Shows progression through SDLC stages with a connected vertical timeline
- Displays an SDLC progress bar showing overall process progression
- Shows current stage with a badge at the top of the timeline
- Highlights stage transitions with special visual treatment
- Uses stage-specific icons and colors for each SDLC stage
- Provides clear visual indicators for stage transitions
- Shows formatted dates with time for each milestone
- Displays descriptive text for each stage transition
- Includes transition arrows showing stage progression
- Implements hover and animation effects for interactive feel
- Handles empty timeline states with appropriate messaging
- Sorts events chronologically for proper display
- Properly handles processes that start at later stages (e.g., Testing, Deployment)
- Shows all previous stages as completed when a process starts at a later stage
- Calculates progress percentage based on current stage and process status
- Provides visual indicators for completed stages (checkmarks, colored borders)
- Updates progress bar segments based on stage completion status

## Data Structure

The timeline entities are defined in `src/types/index.ts` with the following structures:

```typescript
export type TimelineEventType =
  | 'creation'
  | 'update'
  | 'phase-change'
  | 'team-added'
  | 'service-added'
  | 'process-added'
  | 'contact-added'
  | 'document-added'
  | 'other';

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description?: string;
  type: TimelineEventType;
}

export interface ProcessTimelineEvent {
  id: string;
  date: string;
  title: string;
  description?: string;
  stage: SDLCStage;
}
```

## User Flow

1. User navigates to a customer's detail view
2. The customer timeline is displayed in the right column, showing all customer-related events
3. User can expand a process to view its specific timeline
4. The process timeline shows the progression through SDLC stages

## Implementation Details

### Timeline Event Generation

Timeline events are generated automatically for various actions:
1. Customer creation
2. Customer phase changes
3. Adding teams, services, processes, contacts, or documents
4. Process stage transitions

Each event includes:
- A unique ID
- A timestamp
- A descriptive title
- An optional detailed description
- A type categorization

### Timeline Visualization

The timeline is visualized as a vertical sequence:
- Events are ordered from newest to oldest
- Each event has a visual indicator based on its type
- Dates are formatted for readability
- The most recent event appears at the top

### Process Timeline Visualization

Process timelines show SDLC progression with enhanced visual elements:
- A progress bar at the top shows overall progression through the SDLC stages
- Current stage is displayed prominently with a badge at the top
- Each stage transition is represented as an event with a distinctive icon and color
- Stage transitions are highlighted with special visual treatment and labeled
- Stages are connected by a vertical timeline line showing progression
- Each stage has a colored node with an icon representing the stage type
- Dates are formatted with both date and time for precise tracking
- Transition arrows visually show the progression from one stage to another
- Descriptive text provides context for each stage transition
- Interactive hover effects and animations provide engaging feedback
- Cards use subtle animations and scaling effects to improve user experience
- Empty states are handled gracefully with informative messages
- Events are automatically sorted chronologically for proper display
- The visualization makes it easy to understand the process status and history at a glance

#### Special Cases Handling

The timeline visualization handles several special cases:

1. **Processes Starting at Later Stages**:
   - When a process starts at a later stage (e.g., Testing or Deployment), all previous stages are automatically shown as completed
   - The progress bar reflects this by filling in all segments for stages before the starting stage
   - Stage labels for all previous stages are highlighted to indicate completion
   - This ensures proper visualization of processes that skip early stages

2. **Completed Processes**:
   - When a process is marked as 'Completed', all stages are shown as completed regardless of the current stage
   - The progress bar shows 100% completion
   - All timeline nodes display checkmarks
   - All connecting lines are highlighted to show completion

3. **Stage Transitions**:
   - When a process moves from one stage to another, the transition is highlighted
   - A special indicator shows the movement from the previous stage to the new stage
   - The timeline visually emphasizes these transition points

4. **Progress Calculation**:
   - Progress percentage is calculated based on:
     - The current stage of the process
     - The starting stage (for processes that start at later stages)
     - The process status (Not Started, In Progress, Completed)
   - Each stage represents approximately 16.67% of the total progress (100% / 6 stages)
   - For processes in progress, the current stage is shown as 50% complete

## Future Enhancements

1. **Timeline Filtering**: Allow filtering timeline events by type or date range
2. **Timeline Export**: Enable exporting timeline data
3. **Interactive Timeline**: Add interactive elements to timeline events
4. **Timeline Notifications**: Alert users about important timeline events
5. **Timeline Comments**: Allow users to add comments to timeline events
6. **Timeline Milestones**: Highlight significant milestones in the timeline
7. **Timeline Comparison**: Compare timelines across customers or processes
8. **Timeline Predictions**: Use historical data to predict future timeline events
