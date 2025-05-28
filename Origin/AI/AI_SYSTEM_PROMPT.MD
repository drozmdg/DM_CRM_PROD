# AI System Prompt Documentation

## Overview

The AI system prompt is a crucial component of the RETRO_CRM's AI chat functionality. It provides context, instructions, and guidelines to the AI model (Ollama) about how to respond to user queries. A well-crafted system prompt ensures that the AI assistant provides relevant, accurate, and helpful responses within the context of the CRM system.

This document explains how the system prompt is structured, how it's generated, and how to modify it to customize the AI assistant's behavior.

## System Prompt Structure

The system prompt in RETRO_CRM consists of several key sections:

1. **Identity and Role Definition**: Establishes who the AI assistant is and its purpose
2. **Context Information**: Provides the AI with information about the CRM data
3. **Instruction Set**: Defines how the AI should respond to different types of queries
4. **Constraints**: Sets boundaries on what the AI should or shouldn't do
5. **Examples**: Demonstrates ideal interactions to guide the AI's responses

## How the System Prompt is Generated

The system prompt is dynamically generated in the `src/components/Chat/ChatInterface.tsx` file. The generation process follows these steps:

1. **Base Prompt Creation**: A foundational prompt that defines the AI's identity and basic instructions
2. **CRM Data Injection**: Current CRM data is summarized and injected into the prompt
3. **Customization Application**: Any user-defined customizations are applied
4. **Formatting**: The final prompt is formatted for the Ollama API

### Code Implementation

The system prompt generation is primarily handled by the `generateSystemPrompt` function:

```typescript
const generateSystemPrompt = (crmData: CRMDataSummary, customInstructions?: string): string => {
  // Base identity and role
  let prompt = `You are RETRO_CRM AI Assistant, a helpful AI embedded within the RETRO_CRM system. 
Your purpose is to help users understand their CRM data and provide insights.`;

  // Add CRM data context
  prompt += `\n\nCurrent CRM Data Summary:\n${formatCRMDataForPrompt(crmData)}`;

  // Add instruction set
  prompt += `\n\nWhen responding to queries:
- Provide concise, accurate information based on the CRM data
- When asked about specific customers, processes, or teams, reference the actual data
- For analytical questions, provide insights based on the available data
- If information is not available in the CRM data, acknowledge this limitation
- Format your responses using markdown for readability
- Use bullet points for lists and steps`;

  // Add custom instructions if provided
  if (customInstructions) {
    prompt += `\n\nAdditional Instructions:\n${customInstructions}`;
  }

  return prompt;
};
```

The `formatCRMDataForPrompt` function converts the CRM data into a concise format suitable for the prompt:

```typescript
const formatCRMDataForPrompt = (data: CRMDataSummary): string => {
  let formattedData = '';
  
  // Add customer summary
  formattedData += `Customers (${data.customers.length}):\n`;
  data.customers.forEach(customer => {
    formattedData += `- ${customer.name} (Phase: ${customer.phase}, Teams: ${customer.teamCount}, Processes: ${customer.processCount})\n`;
  });
  
  // Add process summary
  formattedData += `\nActive Processes (${data.activeProcesses.length}):\n`;
  data.activeProcesses.forEach(process => {
    formattedData += `- ${process.name} for ${process.customerName} (Status: ${process.status}, Stage: ${process.sdlcStage})\n`;
  });
  
  // Add team summary
  formattedData += `\nTeams (${data.teams.length}):\n`;
  data.teams.forEach(team => {
    formattedData += `- ${team.name} (Customer: ${team.customerName})\n`;
  });
  
  return formattedData;
};
```

## Modifying the System Prompt

You can customize the AI system prompt in several ways:

### 1. Editing the Base Prompt

To modify the foundational identity and instructions:

1. Open `src/components/Chat/ChatInterface.tsx`
2. Locate the `generateSystemPrompt` function
3. Edit the base prompt string to change the AI's identity or basic instructions
4. Save the file and restart the application

Example modification:

```typescript
// Original
let prompt = `You are RETRO_CRM AI Assistant, a helpful AI embedded within the RETRO_CRM system. 
Your purpose is to help users understand their CRM data and provide insights.`;

// Modified
let prompt = `You are RETRO_CRM AI Advisor, an advanced analytics assistant embedded within the RETRO_CRM system. 
Your purpose is to help users understand their CRM data, provide insights, and suggest strategic improvements.`;
```

### 2. Adding Custom Instructions via the UI

Users can add custom instructions through the AI configuration interface:

1. Click the gear icon in the chat interface
2. Enter custom instructions in the "Custom Instructions" field
3. Click "Save Configuration"

These instructions will be appended to the system prompt for all future conversations.

### 3. Modifying the CRM Data Format

To change how CRM data is presented to the AI:

1. Open `src/components/Chat/ChatInterface.tsx`
2. Locate the `formatCRMDataForPrompt` function
3. Modify the formatting logic to change how data is structured
4. Save the file and restart the application

Example modification to add more detail about processes:

```typescript
// Original
formattedData += `\nActive Processes (${data.activeProcesses.length}):\n`;
data.activeProcesses.forEach(process => {
  formattedData += `- ${process.name} for ${process.customerName} (Status: ${process.status}, Stage: ${process.sdlcStage})\n`;
});

// Modified with more details
formattedData += `\nActive Processes (${data.activeProcesses.length}):\n`;
data.activeProcesses.forEach(process => {
  formattedData += `- ${process.name} for ${process.customerName}
    Status: ${process.status}
    Stage: ${process.sdlcStage}
    Due Date: ${process.dueDate || 'Not set'}
    Functional Area: ${process.functionalArea}
    Approval: ${process.approvalStatus}\n`;
});
```

### 4. Adding Constraints or Guidelines

To add specific constraints or guidelines for the AI:

1. Open `src/components/Chat/ChatInterface.tsx`
2. Locate the instruction section in the `generateSystemPrompt` function
3. Add new bullet points or sections for constraints
4. Save the file and restart the application

Example addition:

```typescript
// Original
prompt += `\n\nWhen responding to queries:
- Provide concise, accurate information based on the CRM data
- When asked about specific customers, processes, or teams, reference the actual data
- For analytical questions, provide insights based on the available data
- If information is not available in the CRM data, acknowledge this limitation
- Format your responses using markdown for readability
- Use bullet points for lists and steps`;

// Modified with constraints
prompt += `\n\nWhen responding to queries:
- Provide concise, accurate information based on the CRM data
- When asked about specific customers, processes, or teams, reference the actual data
- For analytical questions, provide insights based on the available data
- If information is not available in the CRM data, acknowledge this limitation
- Format your responses using markdown for readability
- Use bullet points for lists and steps
- Do not make up information that isn't in the CRM data
- Prioritize information about active processes over completed ones
- When suggesting actions, focus on practical, implementable steps
- Maintain a professional, helpful tone at all times`;
```

### 5. Adding Examples

To add examples that guide the AI's response style:

1. Open `src/components/Chat/ChatInterface.tsx`
2. Locate the `generateSystemPrompt` function
3. Add an examples section after the instructions
4. Save the file and restart the application

Example addition:

```typescript
// Add examples section
prompt += `\n\nExample interactions:

User: "Show me information about customer XYZ Corp"
Assistant: "Here's what I found about XYZ Corp:
* Current phase: Steady State
* Contract period: Jan 2023 - Dec 2025
* Teams: 3 (Development, QA, Support)
* Active processes: 2 (Data Migration, System Upgrade)
* Recent activity: System Upgrade process moved to Testing stage on May 15"

User: "What processes are at risk of missing deadlines?"
Assistant: "Based on the current CRM data, these processes may be at risk:
1. Data Migration for ABC Inc - Due in 5 days, still in Development stage
2. API Integration for XYZ Corp - Due in 10 days, currently in Testing with several open issues

I recommend focusing on these processes and potentially reallocating resources to ensure timely completion."`;
```

## Best Practices for System Prompt Modification

1. **Keep it Concise**: The system prompt has token limits. Focus on essential information.
2. **Be Specific**: Clearly define what you want the AI to do and not do.
3. **Provide Context**: Ensure the AI has enough information about the CRM data structure.
4. **Test Thoroughly**: After modifications, test various query types to ensure desired behavior.
5. **Iterate**: Refine the prompt based on actual interaction results.
6. **Maintain Balance**: Balance between giving enough guidance and allowing flexibility.

## Troubleshooting

If the AI responses are not as expected after modifying the system prompt:

1. **Check Token Limits**: Ensure your prompt isn't too long for the model's context window.
2. **Review Formatting**: Ensure the prompt is properly formatted with clear sections.
3. **Check Contradictions**: Ensure there are no contradictory instructions.
4. **Simplify**: If responses are confused, try simplifying your instructions.
5. **Reset to Default**: Use the reset option in the AI configuration to return to default settings.

## Conclusion

The system prompt is a powerful tool for customizing how the AI assistant interacts with users in the RETRO_CRM system. By thoughtfully modifying this prompt, you can create an AI experience that perfectly complements your CRM workflows and provides valuable insights to users.
