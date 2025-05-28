/**
 * AI Chat Context
 * 
 * This file contains functions for managing CRM data context for the AI chat.
 */

import { CRMData } from './types';
import { CustomerService } from '../database/customerService.js';
import { ProcessService } from '../database/processService.js';
import { TeamService } from '../database/teamService.js';
import { supabase } from '../supabase.js';

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
 * Load CRM data from database
 * @returns Promise that resolves when data is loaded
 */
export const loadCRMData = async (): Promise<void> => {
  try {
    const [customers, processes, teams, services] = await Promise.all([
      getCustomers(),
      getProcesses(),
      getTeams(),
      getServices()
    ]);

    // Enrich customers with their related entities
    const enrichedCustomers = customers.map(customer => {
      return {
        ...customer,
        processes: processes.filter(process => process.customerId === customer.id),
        teams: teams.filter(team => team.customerId === customer.id),
        services: services.filter(service => service.customerId === customer.id)
      };
    });

    setCRMData({ customers: enrichedCustomers, processes, teams, services });
    console.log('CRM data loaded for AI context');
  } catch (error) {
    console.error('Error loading CRM data for AI context:', error);
  }
};

/**
 * Generate a system prompt with enhanced CRM data context
 * @returns A system prompt with detailed CRM data context
 */
export const generateSystemPrompt = (): string => {
  if (!crmData || !crmData.customers || crmData.customers.length === 0) {
    return "You are an AI assistant for the Sales Dashboard CRM system. Help the user with their CRM-related questions.";
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

    // Count processes and their statuses
    if (customer.processes) {
      totalProcesses += customer.processes.length;
      customer.processes.forEach((process: any) => {
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

    return `${customer.name} (Phase: ${customer.phase || 'Unknown'}, Processes: ${processCount}, Teams: ${teamCount}, Services: ${serviceCount})`;
  }).join('\n');

  // Format the upcoming renewals
  const renewalsText = upcomingRenewals.length > 0
    ? upcomingRenewals.map(renewal => `${renewal.name} (${renewal.contractEnd})`).join('\n')
    : "None in the next 90 days";

  // Format the system prompt with enhanced CRM data
  return `
You are an AI assistant for the Sales Dashboard CRM system.
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
