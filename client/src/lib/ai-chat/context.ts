/**
 * AI Chat Context Generation
 * 
 * This file contains functions for generating context from CRM data.
 */

import { CRMData } from './types';

// Store CRM data for context generation
let crmData: CRMData = {};

/**
 * Set the CRM data for context generation
 * @param data The CRM data to use for context
 */
export const setCRMData = (data: CRMData): void => {
  crmData = data;
  console.log('Updated CRM context data:', {
    customers: data.customers?.length || 0,
    processes: data.processes?.length || 0,
    teams: data.teams?.length || 0,
    services: data.services?.length || 0
  });
};

/**
 * Get the current CRM data
 * @returns The current CRM data
 */
export const getCRMData = (): CRMData => {
  return crmData;
};

/**
 * Generate a system prompt with enhanced CRM data context
 * @returns A comprehensive system prompt with detailed CRM context
 */
export const generateSystemPrompt = (): string => {
  if (!crmData || !crmData.customers || crmData.customers.length === 0) {
    return `You are an AI assistant for the Sales Dashboard CRM system. 
Currently, no customer data is available. Please ask the user to add some customers first or check if the data is loading.
You can still help with general CRM questions and guidance.`;
  }

  // Generate comprehensive statistics
  const customerCount = crmData.customers.length;
  const processCount = crmData.processes?.length || 0;
  const teamCount = crmData.teams?.length || 0;
  const serviceCount = crmData.services?.length || 0;

  // Process statistics
  const processStatusCounts: Record<string, number> = {};
  const processStageDistribution: Record<string, number> = {};
  const processFunctionalAreaDistribution: Record<string, number> = {};
  const processApprovalStatusDistribution: Record<string, number> = {};
  
  // Customer phase distribution
  const phaseDistribution: Record<string, number> = {};
  
  // Contract renewals
  const upcomingRenewals: any[] = [];
  const today = new Date();
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(today.getDate() + 90);

  // Process customer data
  crmData.customers.forEach((customer: any) => {
    // Count phases
    const phase = customer.phase || 'Unknown';
    phaseDistribution[phase] = (phaseDistribution[phase] || 0) + 1;

    // Check for upcoming contract renewals
    if (customer.contractEndDate) {
      const contractEndDate = new Date(customer.contractEndDate);
      if (contractEndDate > today && contractEndDate <= ninetyDaysFromNow) {
        upcomingRenewals.push({
          name: customer.name,
          contractEnd: customer.contractEndDate
        });
      }
    }
  });

  // Process processes data
  if (crmData.processes) {
    crmData.processes.forEach((process: any) => {
      // Process status counts
      const status = process.status || 'Unknown';
      processStatusCounts[status] = (processStatusCounts[status] || 0) + 1;

      // SDLC stage distribution
      const stage = process.sdlcStage || 'Unknown';
      processStageDistribution[stage] = (processStageDistribution[stage] || 0) + 1;

      // Functional area distribution
      const area = process.functionalArea || 'Unknown';
      processFunctionalAreaDistribution[area] = (processFunctionalAreaDistribution[area] || 0) + 1;

      // Approval status distribution
      const approvalStatus = process.approvalStatus || 'Unknown';
      processApprovalStatusDistribution[approvalStatus] = (processApprovalStatusDistribution[approvalStatus] || 0) + 1;
    });
  }
  // Generate customer details
  const customerDetails = crmData.customers.map((customer: any) => {
    const processes = crmData.processes?.filter((p: any) => p.customerId === customer.id) || [];
    const teams = crmData.teams?.filter((t: any) => t.customerId === customer.id) || [];
    const services = crmData.services?.filter((s: any) => s.customerId === customer.id) || [];

    return `${customer.name} (Phase: ${customer.phase || 'Unknown'}, Processes: ${processes.length}, Teams: ${teams.length}, Services: ${services.length})`;
  }).join('\n');

  // Generate team details
  const teamDetails = new Map<string, { count: number, customers: string[] }>();
  if (crmData.teams) {
    crmData.teams.forEach((team: any) => {
      const customer = crmData.customers?.find(c => c.id === team.customerId);
      if (customer) {
        if (!teamDetails.has(team.name)) {
          teamDetails.set(team.name, { count: 0, customers: [] });
        }
        const details = teamDetails.get(team.name)!;
        details.count++;
        details.customers.push(customer.name);
      }
    });
  }

  const teamDetailsText = Array.from(teamDetails.entries())
    .map(([name, details]) => `${name} (${details.count} customers: ${details.customers.join(', ')})`)
    .join('\n');

  // Generate service details
  const serviceDetails = new Map<string, { count: number, customers: string[] }>();
  if (crmData.services) {
    crmData.services.forEach((service: any) => {
      const customer = crmData.customers?.find(c => c.id === service.customerId);
      if (customer) {
        if (!serviceDetails.has(service.name)) {
          serviceDetails.set(service.name, { count: 0, customers: [] });
        }
        const details = serviceDetails.get(service.name)!;
        details.count++;
        details.customers.push(customer.name);
      }
    });
  }

  const serviceDetailsText = Array.from(serviceDetails.entries())
    .map(([name, details]) => `${name} (${details.count} customers: ${details.customers.join(', ')})`)
    .join('\n');

  // Format the upcoming renewals
  const renewalsText = upcomingRenewals.length > 0
    ? upcomingRenewals.map(renewal => `${renewal.name} (${renewal.contractEnd})`).join('\n')
    : "None in the next 90 days";

  // Generate the comprehensive system prompt
  return `You are an AI assistant for the Sales Dashboard CRM system.
You have full access to the CRM data since you're running locally and the user is the sole administrator.

## SUMMARY STATISTICS

### Customer Statistics
- Total Customers: ${customerCount}
- Customer Phase Distribution: ${Object.entries(phaseDistribution).map(([phase, count]) => `${phase}: ${count}`).join(', ')}
- Upcoming Contract Renewals: ${upcomingRenewals.length} in the next 90 days

### Process Statistics
- Total Processes: ${processCount}
- Process Status Distribution: ${Object.entries(processStatusCounts).map(([status, count]) => `${status}: ${count}`).join(', ')}
- SDLC Stage Distribution: ${Object.entries(processStageDistribution).map(([stage, count]) => `${stage}: ${count}`).join(', ')}
- Functional Area Distribution: ${Object.entries(processFunctionalAreaDistribution).map(([area, count]) => `${area}: ${count}`).join(', ')}
- Approval Status Distribution: ${Object.entries(processApprovalStatusDistribution).map(([status, count]) => `${status}: ${count}`).join(', ')}

### Team & Service Statistics
- Total Teams: ${teamCount}
- Total Services: ${serviceCount}

## DETAILED CUSTOMER INFORMATION
${customerDetails}

## TEAM DETAILS
${teamDetailsText || 'No teams available'}

## SERVICE DETAILS
${serviceDetailsText || 'No services available'}

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
Be helpful, detailed, and accurate in your responses.`.trim();
};
