# AI Chat Documentation

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

1. **Chat**: The main container component that combines all chat-related components
2. **ChatHistory**: Displays the message history with automatic scrolling
3. **ChatInput**: Handles user input with a textarea and send button
4. **ChatMessage**: Renders individual chat messages with appropriate styling
5. **ChatSessions**: Manages multiple chat sessions with create/delete functionality
6. **ChatConfig**: Provides a configuration interface for Ollama settings
7. **ChatDataProvider**: Connects the CustomerContext with the AI chat functionality

### State Management

The chat functionality uses React Context for state management:

- **ChatContext**: Provides chat state and functions to all components
- **ChatProvider**: Wraps the application to provide chat functionality

## Data Model

The chat functionality uses the following data types:

```typescript
// Type for message sender (user or AI)
export type MessageSender = 'user' | 'ai';

// Structure for individual chat messages
export interface ChatMessage {
  id: string;
  content: string;
  sender: MessageSender;
  timestamp: string;
  isLoading?: boolean;
}

// Structure for a chat session
export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
```

## Usage

The AI Chat interface is accessible from the Reports tab in the application. The interface is divided into two main sections:

### Left Panel (Settings and Sessions)
- Configure AI settings using the "Configure AI Settings" button
- View the system prompt using the "View System Prompt" button
- Create new chat sessions using the "New Chat" button
- Clear the current chat history using the "Clear Current Chat" button
- View and switch between different chat sessions
- Delete chat sessions using the trash icon

### Main Panel (Chat Interface)
- View the conversation history with the AI assistant
- Type messages in the input field and press Enter or click the Send button
- View responses from the AI assistant

Users can interact with the chat by:
1. Typing messages in the input field and pressing Enter or clicking the Send button
2. Creating new chat sessions when starting a new conversation topic
3. Switching between different chat sessions to manage multiple conversations
4. Clearing the current chat history when starting fresh within the same session
5. Configuring the AI settings to customize the behavior of the assistant
6. Viewing the system prompt to understand what context is provided to the AI

## Implementation Details

### Chat Context

The ChatContext provides the following functionality:

- `currentSession`: The currently active chat session
- `sessions`: Array of all chat sessions
- `sendMessage`: Function to send a new message
- `createNewSession`: Function to create a new chat session
- `switchSession`: Function to switch to a different session
- `deleteSession`: Function to delete a session
- `clearCurrentSession`: Function to clear the current session's history
- `isProcessing`: Boolean indicating if the AI is processing a response

### Data Persistence

Chat sessions are stored in localStorage under the key 'retro_crm_chat_sessions'. This ensures that:

- Chat history persists between page refreshes
- Multiple chat sessions can be maintained
- The application remains consistent with other data storage in the CRM

To ensure robust persistence, each operation that modifies chat data (creating sessions, sending messages, deleting sessions, etc.) immediately saves to localStorage. This approach provides several benefits:

- Data is saved immediately, not just when React's effect hooks run
- Chat data persists even if other parts of the application reset their data
- The system is more resilient to unexpected page refreshes or navigation

### Ollama Integration

The chat functionality integrates with Ollama, a local AI model server:

- **API Integration**: Communicates with the Ollama API to generate responses
- **Configurable Settings**: Allows customization of endpoint, model, temperature, and max tokens
- **Fallback Mechanism**: Falls back to mock responses if Ollama is unavailable
- **Error Handling**: Gracefully handles API errors with user-friendly messages
- **CRM Data Context**: Provides the AI with context about the CRM data

#### CRM Data Context

The AI is provided with comprehensive access to the CRM data to help it generate detailed and specific responses. Since the application is used by a single administrator with a local LLM, privacy concerns are minimal, and full data access is provided.

The enhanced system prompt includes:

- **Summary Statistics**: Detailed counts and distributions of customers, processes, teams, and services
- **Customer Information**: Comprehensive details about each customer including phase, contract dates, and associated entities
- **Process Analytics**: Distribution of processes by status, SDLC stage, functional area, and approval status
- **Team & Service Details**: Information about which teams and services are associated with which customers
- **Upcoming Contract Renewals**: Identification of contracts expiring in the next 90 days
- **Response Guidelines**: Instructions for the AI to format responses using markdown and provide specific data

The system prompt is structured in a markdown format with clear sections, making it easier for the AI to reference specific information. Additionally, the AI has access to helper functions that can retrieve specific information about customers, teams, services, and processes when needed.

Users can view the complete system prompt at any time by clicking the "View System Prompt" button in the left panel. This opens a dialog displaying the exact context being provided to the AI, which helps users understand how the AI generates its responses and what information it has access to.

The AI can answer specific questions about individual customers, teams, and processes, providing a powerful tool for analyzing and understanding your CRM data.

#### Configuration Options

The Ollama integration can be configured through the UI:

- **Endpoint URL**: The URL of the Ollama API (default: http://localhost:11434/api/generate)
- **Model**: Dropdown selection of available models from your Ollama installation
- **Temperature**: Controls randomness of responses (0.0-2.0, default: 0.7)
- **Max Tokens**: Maximum length of generated responses (default: 500)
- **Use CRM Data Context**: Enable/disable providing CRM data context to the AI

The configuration interface includes:
- A refresh button to fetch the latest available models from your Ollama installation
- Connection status indicators showing whether the application can connect to Ollama
- Helpful error messages when Ollama is not running or when models are not available

#### Configuration Persistence

All Ollama configuration settings are stored in Supabase and automatically synchronized across devices. This ensures:

- Settings persist between different devices (desktop, iPad, etc.)
- Users don't need to reconfigure settings on each device
- The application maintains a consistent user experience across all platforms

The system uses a hybrid approach:
- Primary storage is in Supabase for cross-device synchronization
- Local storage is used as a fallback for offline operation
- Changes made on one device are automatically available on other devices

When the application starts, it automatically loads the saved configuration from Supabase. If the Supabase connection is unavailable, it falls back to localStorage. If no saved configuration is found in either location, it uses the default settings.

The configuration interface includes visual indicators showing when settings are being synchronized to the cloud and when the synchronization is complete, providing users with clear feedback about the status of their settings.

## UI Features

The Chat UI includes several features to enhance the user experience:

### Markdown Support

AI responses are rendered with rich markdown formatting, including:
- Headings and subheadings
- Bulleted and numbered lists
- Tables for structured data
- Code blocks with syntax highlighting
- Links and blockquotes
- Emphasis and strong text

### Suggested Queries

The chat interface includes a suggested queries feature that:
- Provides categorized query suggestions
- Allows users to click on a suggestion to use it
- Includes queries for different aspects of the CRM data
- Can be toggled on/off with a button in the chat input

### Enhanced Message Display

Messages in the chat interface feature:
- Clear visual distinction between user and AI messages
- Timestamp display for each message
- Loading indicator during AI response generation
- Proper spacing and formatting for readability

### System Prompt Viewer

The chat interface includes a system prompt viewer that:
- Allows users to see the exact context provided to the AI
- Displays the complete system prompt in a readable format
- Shows detailed CRM data statistics and guidelines
- Helps users understand how the AI generates responses
- Can be accessed via the "View System Prompt" button in the left panel

## Future Enhancements

Planned enhancements for the AI Chat functionality include:

1. **Message Actions**: Add ability to perform actions directly from chat messages (e.g., "Create a new customer")
2. **Export Chat History**: Allow users to export chat sessions for record-keeping
3. **Chat History for Context**: Send previous messages as context for better continuity
4. **Advanced Data Visualization**: Generate charts and graphs based on CRM data
5. **Direct Data Manipulation**: Allow the AI to make changes to the CRM data with user confirmation
6. **Chat Session Synchronization**: Synchronize chat sessions across devices using Supabase
7. **Enhanced Offline Support**: Improve the application's ability to function without an internet connection

## Code Organization

The AI Chat functionality is organized in a modular way:

- **src/components/Chat/**: Contains all chat-related UI components
  - **Chat.tsx**: Main container component with two-column layout (settings panel and chat interface)
  - **ChatHistory.tsx**: Displays message history with automatic scrolling
  - **ChatInput.tsx**: Handles user input and message submission
  - **ChatMessage.tsx**: Renders individual messages with appropriate styling
  - **ChatSessions.tsx**: Manages multiple chat sessions in the left panel
  - **ChatConfig.tsx**: Provides a configuration interface for Ollama settings
  - **ChatDataProvider.tsx**: Connects the CustomerContext with the AI chat functionality
- **src/context/ChatContext.tsx**: Provides state management for chat functionality
- **src/types/index.ts**: Contains type definitions for chat data structures
- **src/lib/ai-chat.ts**: Contains the core AI chat functionality (message processing, configuration persistence)
- **src/lib/supabase.ts**: Provides Supabase client configuration for cloud storage

This modular organization provides several benefits:

1. **Separation of Concerns**: UI components are separate from business logic
2. **Maintainability**: Each component has a single responsibility
3. **Testability**: Components and logic can be tested independently
4. **Reusability**: Components can be reused in other parts of the application
5. **Scalability**: New features can be added without modifying existing code
6. **Cross-Device Compatibility**: Settings synchronization across different devices

The separation of AI functionality into its own file (`src/lib/ai-chat.ts`) makes it easier to maintain and extend the Ollama integration. This modular approach allows for:

1. **Easy Switching**: The AI provider can be changed without affecting the UI components
2. **Independent Testing**: The AI functionality can be tested separately from the UI
3. **Clear Responsibility**: Each module has a well-defined responsibility
4. **Simplified Maintenance**: Changes to the AI integration don't require changes to the UI
5. **Storage Flexibility**: The configuration storage mechanism can be changed without affecting the UI

The integration with Supabase for configuration storage demonstrates this flexibility, allowing us to move from local-only storage to cloud-synchronized storage without significant changes to the UI components.
