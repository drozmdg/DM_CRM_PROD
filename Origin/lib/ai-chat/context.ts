/**
 * AI Chat Context
 * 
 * This file contains functions for managing CRM data context for the AI chat.
 */

import { CRMData } from './types';

// Store CRM data for context
let crmData: CRMData | null = null;

/**
 * Set the CRM data for context
 * @param data The CRM data to use for context
 */
export const setCRMData = (data: CRMData): void => {
  crmData = data;
};

/**
 * Get the current CRM data
 * @returns The current CRM data
 */
export const getCRMData = (): CRMData | null => {
  return crmData;
};

/**
 * Find a customer by name
 * @param name The customer name to search for
 * @returns The customer object or null if not found
 */
export const findCustomerByName = (name: string): any => {
  if (!crmData || !crmData.customers) return null;

  const normalizedName = name.toLowerCase().trim();
  return crmData.customers.find((customer: any) =>
    customer.name.toLowerCase().includes(normalizedName)
  ) || null;
};

/**
 * Get all processes for a specific customer
 * @param customerName The name of the customer
 * @returns Array of processes or empty array if customer not found
 */
export const getCustomerProcesses = (customerName: string): any[] => {
  const customer = findCustomerByName(customerName);
  if (!customer || !customer.processes) return [];
  return customer.processes;
};

/**
 * Get all teams for a specific customer
 * @param customerName The name of the customer
 * @returns Array of teams or empty array if customer not found
 */
export const getCustomerTeams = (customerName: string): any[] => {
  const customer = findCustomerByName(customerName);
  if (!customer || !customer.teams) return [];
  return customer.teams;
};

/**
 * Get all services for a specific customer
 * @param customerName The name of the customer
 * @returns Array of services or empty array if customer not found
 */
export const getCustomerServices = (customerName: string): any[] => {
  const customer = findCustomerByName(customerName);
  if (!customer || !customer.services) return [];
  return customer.services;
};

/**
 * Generate a system prompt with enhanced CRM data context
 * @returns A system prompt with detailed CRM data context
 */
export const generateSystemPrompt = (): string => {
  if (!crmData || !crmData.customers || crmData.customers.length === 0) {
    return "You are an AI assistant for RETRO_CRM, a customer relationship management system. Help the user with their CRM-related questions.";
  }

  // Generate a summary of the CRM data
  const customerCount = crmData.customers.length;

  // Count processes by status and SDLC stage
  const processStatusCounts: Record<string, number> = {};
  const processStageDistribution: Record<string, number> = {};
  const processFunctionalAreaDistribution: Record<string, number> = {};
  const processApprovalStatusDistribution: Record<string, number> = {};
  let totalProcesses = 0;

  // Count teams and services
  const teamCount = new Set();
  const serviceCount = new Set();

  // Get phases distribution
  const phaseDistribution: Record<string, number> = {};

  // Get upcoming contract renewals (next 90 days)
  const upcomingRenewals: any[] = [];
  const today = new Date();
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(today.getDate() + 90);

  // Process the customer data
  crmData.customers.forEach((customer: any) => {
    // Count phases
    const phase = customer.phase;
    phaseDistribution[phase] = (phaseDistribution[phase] || 0) + 1;

    // Check for upcoming contract renewals
    if (customer.contractEnd) {
      const contractEndDate = new Date(customer.contractEnd);
      if (contractEndDate > today && contractEndDate <= ninetyDaysFromNow) {
        upcomingRenewals.push({
          name: customer.name,
          contractEnd: customer.contractEnd
        });
      }
    }

    // Count processes and their statuses
    if (customer.processes) {
      totalProcesses += customer.processes.length;
      customer.processes.forEach((process: any) => {
        // Process status counts
        const status = process.status;
        processStatusCounts[status] = (processStatusCounts[status] || 0) + 1;

        // SDLC stage distribution
        const stage = process.sdlcStage;
        processStageDistribution[stage] = (processStageDistribution[stage] || 0) + 1;

        // Functional area distribution
        const area = process.functionalArea;
        processFunctionalAreaDistribution[area] = (processFunctionalAreaDistribution[area] || 0) + 1;

        // Approval status distribution
        const approvalStatus = process.approvalStatus;
        processApprovalStatusDistribution[approvalStatus] = (processApprovalStatusDistribution[approvalStatus] || 0) + 1;
      });
    }

    // Count unique teams
    if (customer.teams) {
      customer.teams.forEach((team: any) => {
        teamCount.add(team.id);
      });
    }

    // Count unique services
    if (customer.services) {
      customer.services.forEach((service: any) => {
        serviceCount.add(service.id);
      });
    }
  });

  // Get customer details for the prompt
  const customerDetails = crmData.customers.map((customer: any) => {
    const processCount = customer.processes ? customer.processes.length : 0;
    const teamCount = customer.teams ? customer.teams.length : 0;
    const serviceCount = customer.services ? customer.services.length : 0;

    return `${customer.name} (Phase: ${customer.phase}, Processes: ${processCount}, Teams: ${teamCount}, Services: ${serviceCount})`;
  }).join('\n');

  // Get team names and details
  const teamDetails = new Map<string, { count: number, customers: string[] }>();
  crmData.customers.forEach((customer: any) => {
    if (customer.teams) {
      customer.teams.forEach((team: any) => {
        if (!teamDetails.has(team.name)) {
          teamDetails.set(team.name, { count: 0, customers: [] });
        }
        const details = teamDetails.get(team.name)!;
        details.count++;
        details.customers.push(customer.name);
      });
    }
  });

  const teamDetailsText = Array.from(teamDetails.entries())
    .map(([name, details]) => `${name} (${details.count} customers: ${details.customers.join(', ')})`)
    .join('\n');

  // Get service names and details
  const serviceDetails = new Map<string, { count: number, customers: string[] }>();
  crmData.customers.forEach((customer: any) => {
    if (customer.services) {
      customer.services.forEach((service: any) => {
        if (!serviceDetails.has(service.name)) {
          serviceDetails.set(service.name, { count: 0, customers: [] });
        }
        const details = serviceDetails.get(service.name)!;
        details.count++;
        details.customers.push(customer.name);
      });
    }
  });

  const serviceDetailsText = Array.from(serviceDetails.entries())
    .map(([name, details]) => `${name} (${details.count} customers: ${details.customers.join(', ')})`)
    .join('\n');

  // Format the upcoming renewals
  const renewalsText = upcomingRenewals.length > 0
    ? upcomingRenewals.map(renewal => `${renewal.name} (${renewal.contractEnd})`).join('\n')
    : "None in the next 90 days";

  // Format the system prompt with enhanced CRM data
  return `
You are an AI assistant for RETRO_CRM, a customer relationship management system.
You have full access to the CRM data since you're running locally and the user is the sole administrator.

## SUMMARY STATISTICS

### Customer Statistics
- Total Customers: ${customerCount}
- Customer Phase Distribution: ${Object.entries(phaseDistribution).map(([phase, count]) => `${phase}: ${count}`).join(', ')}
- Upcoming Contract Renewals: ${upcomingRenewals.length} in the next 90 days

### Process Statistics
- Total Processes: ${totalProcesses}
- Process Status Distribution: ${Object.entries(processStatusCounts).map(([status, count]) => `${status}: ${count}`).join(', ')}
- SDLC Stage Distribution: ${Object.entries(processStageDistribution).map(([stage, count]) => `${stage}: ${count}`).join(', ')}
- Functional Area Distribution: ${Object.entries(processFunctionalAreaDistribution).map(([area, count]) => `${area}: ${count}`).join(', ')}
- Approval Status Distribution: ${Object.entries(processApprovalStatusDistribution).map(([status, count]) => `${status}: ${count}`).join(', ')}

### Team & Service Statistics
- Total Teams: ${teamCount.size}
- Total Services: ${serviceCount.size}

## DETAILED CUSTOMER INFORMATION
${customerDetails}

## TEAM DETAILS
${teamDetailsText}

## SERVICE DETAILS
${serviceDetailsText}

## UPCOMING CONTRACT RENEWALS
${renewalsText}

## RESPONSE GUIDELINES
- When answering questions, provide specific and detailed information about the CRM data.
- Format your responses using markdown for better readability.
- Use tables when presenting comparative data.
- Use bullet points for lists of items.
- Include specific customer, team, or process names when relevant.
- If asked about trends or patterns, analyze the data and provide insights.
- For process-related questions, consider the SDLC stages and approval statuses.
- When discussing customers, mention their phase and contract details when relevant.

You have access to all customer details including their processes, teams, services, and contacts.
The user is the sole administrator of this system and has authorized full data access.
Be helpful, detailed, and accurate in your responses.
`.trim();
};
