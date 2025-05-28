/**
 * Documentation content for DM_CRM
 *
 * This file contains the content of documentation files embedded directly in the application.
 * This approach avoids issues with loading Markdown files from the server.
 */

// Define the structure for documentation files
export interface DocContent {
  id: string;
  name: string;
  content: string;
  category?: string;
}

// Documentation content repository
export const docContents: DocContent[] = [
  {
    id: 'readme',
    name: 'Documentation Overview',
    category: 'Overview',
    content: `# DM_CRM Documentation

## Overview

DM_CRM is a Customer Relationship Management system designed to help businesses manage their client relationships, projects, and services. This documentation provides detailed information about each major function of the application.

## Core Modules

### Customer Management
The core module for viewing, filtering, and managing customer information.

### Team Management
Functionality for creating and managing teams associated with customers.

### Service Management
Tools for defining and tracking services provided to customers.

### Process Management
Features for tracking and managing customer processes through their lifecycle.

### Process Contact and Output Delivery
Capabilities for assigning contacts to processes and specifying output delivery methods for extracts.

### Contact Management
Capabilities for storing and managing contact information for both client representatives and internal team members.

### Document Management
Functionality for uploading, categorizing, and managing customer-related documents.

### Timeline Visualization
Tools for visualizing the chronological progression of customer events and processes.

### Customer Avatar
Component for generating and displaying consistent visual representations of customers.

### AI Chat
Interactive AI assistant interface for providing insights and answering questions about CRM data.

### Data Model
Comprehensive documentation of the data model, including entities, relationships, and constraints.

## Getting Started

To run the application locally:

1. Clone the repository
2. Install dependencies with \`npm install\`
3. Start the development server with \`npm run dev\`
4. Access the application at \`http://localhost:8080\`
`
  },
  {
    id: 'implementation',
    name: 'Implementation Guide',
    category: 'Overview',
    content: `# DM_CRM Implementation Guide

## Project Overview

DM_CRM is a Customer Relationship Management system designed to help businesses manage their client relationships, projects, and services. The application features a modern design while providing comprehensive CRM functionality.

## Technology Stack

- **Frontend**: React with TypeScript
- **UI Framework**: Tailwind CSS with custom retro styling
- **Routing**: React Router
- **State Management**: React Hooks
- **Form Handling**: React Hook Form
- **Notifications**: Sonner Toast
- **Build Tool**: Vite

## Project Structure

\`\`\`
/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/            # Page components for routing
│   ├── types/            # TypeScript type definitions
│   ├── mock/             # Mock data for development
│   ├── lib/              # Utility functions
│   ├── context/          # React context providers
│   └── App.tsx           # Main application component
│
└── docs/
    ├── CUSTOMER_MANAGEMENT.md    # Customer management documentation
    ├── PROCESS_MANAGEMENT.md     # Process management documentation
    ├── TIMELINE_VISUALIZATION.md # Timeline visualization documentation
    ├── CUSTOMER_AVATAR.md        # Customer avatar component documentation
    ├── AI_CHAT.md                # AI chat functionality documentation
    ├── DATA_MODEL.md             # Comprehensive data model documentation
    └── [Other documentation]     # Additional feature documentation
\`\`\`

## Core Features

1. **Customer Management**
   - View customer list with filtering
   - View customer details in read-only mode
   - Edit customer details
   - Track customer lifecycle phases

2. **Team Management**
   - Add and manage teams for each customer
   - Track team finance codes

3. **Service Management**
   - Add and manage services for each customer
   - Track monthly hours for services

4. **Process Management**
   - Track processes with SDLC stages
   - Manage process approvals and timelines
   - Visualize process progress

5. **Contact Management**
   - Store client and internal contacts
   - Track contact details and roles

6. **Document Management**
   - Upload and categorize client documents
   - Track document metadata

7. **Timeline Visualization**
   - Track customer events in a timeline
   - Visualize process progression

8. **Customer Avatar Functionality**
   - Generate consistent avatars based on customer names
   - Display customer initials with color-coded backgrounds
   - Provide visual consistency across the application

9. **AI Chat Interface**
   - Interactive chat with AI assistant
   - Multiple chat sessions management
   - Contextual responses to user queries
`
  },
  {
    id: 'migration',
    name: 'Migration Strategy',
    category: 'Overview',
    content: `# DM_CRM Migration Strategy

## Overview

This document outlines the strategy for migrating the DM_CRM application from its current implementation (using localStorage for data persistence and a local Ollama instance for AI functions) to a containerized environment using Docker Compose with:

1. A Supabase container for persistent data storage
2. A dockerized Ollama instance for AI functionality
3. The DM_CRM application itself in a container

This migration will enhance the application's scalability, portability, and data persistence capabilities while maintaining the current functionality and user experience.

## Current Architecture

### Data Storage
- All application data is stored in the browser's localStorage
- Data is loaded from localStorage when the application starts
- Changes are immediately saved to localStorage
- Data keys:
  - \`retro_crm_customers\`: Customer data including related entities
  - \`retro_crm_chat_sessions\`: AI chat history
  - \`retro_crm_ollama_config\`: Ollama configuration settings

### AI Functionality
- Uses a local Ollama instance running on the host machine
- Connects to Ollama via HTTP at \`http://localhost:11434/api/generate\`
- Configuration includes model selection, temperature, and max tokens
- Falls back to mock responses if Ollama is unavailable

## Target Architecture

### Docker Compose Environment
- **RETRO_CRM Container**: React application served via Nginx
- **Supabase Container**: PostgreSQL database with Supabase extensions
- **Ollama Container**: Dockerized Ollama instance with pre-loaded models

### Data Flow
1. RETRO_CRM application connects to Supabase for data persistence
2. RETRO_CRM connects to Ollama container for AI functionality
3. All containers communicate within the same Docker network

## Migration Plan

### Phase 1: Environment Setup and Configuration

#### 1.1 Docker Environment Setup
- Create a \`docker-compose.yml\` file in the project root
- Define services for RETRO_CRM, Supabase, and Ollama
- Configure networking between containers
- Set up volume mounts for persistent data

#### 1.2 Dockerfile for RETRO_CRM
- Create a Dockerfile for the RETRO_CRM application
- Configure build process for the React application
- Set up Nginx to serve the built application

#### 1.3 Environment Configuration
- Create \`.env\` file for environment variables
- Configure connection strings and API endpoints
- Set up development and production configurations
`
  },
  {
    id: 'customer',
    name: 'Customer Management',
    category: 'Core Modules',
    content: `# Customer Management

## Overview

The Customer Management module is the core component of RETRO_CRM, providing functionality to view, filter, and manage customer information. It serves as the central hub for accessing all customer-related data and actions.

## Features

- **Customer Dashboard**: View all customers with filtering options
- **Customer Detail View**: See comprehensive information about a specific customer
- **Customer Editing**: Modify customer details, including name, phase, and contract dates
- **Related Entity Management**: Access teams, services, processes, contacts, and documents associated with a customer

## Components

### CustomerDashboard

The main dashboard for viewing and filtering customers.

**Location**: \`src/pages/CustomerDashboard.tsx\`

**Features**:
- Displays a grid of customer cards
- Provides filtering by name and phase
- Shows customer phase with color-coded badges
- Displays customer avatars with initials
- Shows counts of processes and services
- Includes a "Reset Data" button for testing

### CustomerDetail

A comprehensive view of a single customer's information.

**Location**: \`src/components/CustomerDetail.tsx\`

**Features**:
- Displays customer name, phase, and contract dates
- Shows teams, services, and processes in separate sections
- Includes contacts and documents sections
- Displays a timeline of customer events
- Provides an "Edit Customer" button to switch to edit mode

### CustomerForm

A form for editing customer details.

**Location**: \`src/components/CustomerForm.tsx\`

**Features**:
- Allows editing of customer name
- Provides phase selection via dropdown
- Includes date pickers for contract start and end dates
- Validates form inputs
- Handles form submission and cancellation

## Data Structure

The Customer entity is defined in \`src/types/index.ts\` with the following structure:

\`\`\`typescript
export interface Customer {
  id: string;
  name: string;
  logo?: string;
  avatarColor?: string; // Color for the avatar background
  phase: CustomerPhase;
  teams: Team[];
  processes: Process[];
  services: Service[];
  contacts: Contact[];
  documents: Document[];
  timeline: TimelineEvent[];
  projects: Project[];
  contractStartDate?: string;
  contractEndDate?: string;
  createdAt: string;
  updatedAt: string;
}
\`\`\`
`
  },
  {
    id: 'ai-chat',
    name: 'AI Chat',
    category: 'Components',
    content: `# AI Chat Documentation

## Overview

The AI Chat functionality in RETRO_CRM provides an interactive chat interface on the Reports tab, allowing the administrator to communicate with an AI assistant. This feature enables comprehensive access to CRM data, detailed insights, and assistance with various CRM-related tasks. Since the application is used by a single administrator with a local LLM (Ollama), the AI has full access to all CRM data, enabling it to provide specific and detailed information about customers, processes, teams, and services.

## Features

- **Interactive Chat Interface**: A retro-styled chat interface consistent with the application's design
- **Multiple Chat Sessions**: Create, switch between, and manage multiple chat sessions
- **Session Persistence**: Chat history is saved in localStorage for persistence between sessions
- **Ollama Integration**: Uses a local Ollama instance to generate AI responses
- **Configurable AI Settings**: Allows users to configure the Ollama endpoint, model, and parameters
- **Fallback Responses**: Provides mock responses if Ollama is not available
- **Comprehensive Data Access**: Full access to all CRM data for detailed insights and responses
- **Customer-Specific Queries**: Ability to ask about specific customers, teams, and processes
- **Real-Time Data Analysis**: Responses based on the current state of the CRM data
- **Markdown Support**: Renders AI responses with rich markdown formatting
- **Suggested Queries**: Provides clickable suggested queries to help users get started
- **Enhanced System Prompt**: Includes detailed CRM statistics and data relationships

## Components

### Core Components

- **Chat.tsx**: Main container component that provides the chat interface
- **ChatHistory.tsx**: Displays the chat message history
- **ChatInput.tsx**: Handles user input and message submission
- **ChatMessage.tsx**: Renders individual chat messages with Markdown support
- **ChatSessions.tsx**: Manages multiple chat sessions
- **ChatConfig.tsx**: Provides configuration options for the Ollama integration
- **ChatDataProvider.tsx**: Connects the chat functionality with CRM data

### Implementation Details

The AI Chat functionality is implemented using the following approach:

#### Chat Context

The chat state is managed through a React context provider:

- **ChatContext.tsx**: Provides state management for chat sessions and messages
- Handles creating, updating, and deleting chat sessions
- Manages the current active session
- Stores chat history in localStorage for persistence

#### Ollama Integration

The chat functionality integrates with Ollama, a local AI model server:

- **ai-chat.ts**: Contains the core AI chat functionality
- Handles communication with the Ollama API
- Manages configuration settings
- Provides fallback responses when Ollama is unavailable
- Generates system prompts with CRM data context

#### Data Persistence

To ensure robust persistence, each operation that modifies chat data (creating sessions, sending messages, deleting sessions, etc.) immediately saves to localStorage. This approach provides several benefits:

- Data is saved immediately, not just when React's effect hooks run
- Chat data persists even if other parts of the application reset their data
- The system is more resilient to unexpected page refreshes or navigation
`
  }
];

/**
 * Get a documentation content by ID
 * @param id ID of the documentation content
 * @returns The documentation content or undefined if not found
 */
export const getDocContentById = (id: string): DocContent | undefined => {
  return docContents.find(doc => doc.id === id);
};

/**
 * Group documentation content by category
 * @returns Record of categories with their content
 */
export const getGroupedDocContents = (): Record<string, DocContent[]> => {
  return docContents.reduce((acc, doc) => {
    const category = doc.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, DocContent[]>);
};

/**
 * Get sorted category names
 * @returns Array of sorted category names
 */
export const getSortedCategories = (): string[] => {
  const groupedContents = getGroupedDocContents();
  return Object.keys(groupedContents).sort((a, b) => {
    // Custom sort order
    const order = ['Overview', 'Core Modules', 'Components', 'Data', 'UI', 'Uncategorized'];
    return order.indexOf(a) - order.indexOf(b);
  });
};
