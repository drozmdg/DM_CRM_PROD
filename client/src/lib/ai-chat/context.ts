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
  const productCount = crmData.products?.length || 0;
  const contactCount = crmData.contacts?.length || 0;
  const documentCount = crmData.documents?.length || 0;

  // Process statistics
  const processStatusCounts: Record<string, number> = {};
  const processStageDistribution: Record<string, number> = {};
  const processFunctionalAreaDistribution: Record<string, number> = {};
  const processApprovalStatusDistribution: Record<string, number> = {};
  
  // Pharmaceutical product statistics
  const therapeuticAreaDistribution: Record<string, number> = {};
  const drugClassDistribution: Record<string, number> = {};
  const regulatoryStatusDistribution: Record<string, number> = {};
  const responsibilityLevelDistribution: Record<string, number> = {};
  const productActivityStatus: Record<string, number> = {};
  const crossTeamProducts: any[] = [];
  
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

  // Process pharmaceutical product data
  if (crmData.products) {
    crmData.products.forEach((product: any) => {
      // Therapeutic area distribution
      const therapeuticArea = product.therapeuticArea || 'Unknown';
      therapeuticAreaDistribution[therapeuticArea] = (therapeuticAreaDistribution[therapeuticArea] || 0) + 1;

      // Drug class distribution
      const drugClass = product.drugClass || 'Unknown';
      drugClassDistribution[drugClass] = (drugClassDistribution[drugClass] || 0) + 1;

      // Regulatory status distribution
      const regulatoryStatus = product.regulatoryStatus || 'Unknown';
      regulatoryStatusDistribution[regulatoryStatus] = (regulatoryStatusDistribution[regulatoryStatus] || 0) + 1;

      // Product activity status
      const isActive = product.isActive ? 'Active' : 'Inactive';
      productActivityStatus[isActive] = (productActivityStatus[isActive] || 0) + 1;

      // Team responsibility analysis
      if (product.teams && product.teams.length > 0) {
        // Track cross-team products (products assigned to multiple teams)
        if (product.teams.length > 1) {
          crossTeamProducts.push({
            name: product.name,
            teamCount: product.teams.length,
            teams: product.teams.map((tp: any) => tp.team?.name || 'Unknown Team').join(', ')
          });
        }

        // Responsibility level distribution
        product.teams.forEach((teamProduct: any) => {
          const responsibilityLevel = teamProduct.responsibilityLevel || 'Unknown';
          responsibilityLevelDistribution[responsibilityLevel] = (responsibilityLevelDistribution[responsibilityLevel] || 0) + 1;
        });
      }
    });
  }

  // Generate customer details
  const customerDetails = crmData.customers.map((customer: any) => {
    const processes = crmData.processes?.filter((p: any) => p.customerId === customer.id) || [];
    const teams = crmData.teams?.filter((t: any) => t.customerId === customer.id) || [];
    const services = crmData.services?.filter((s: any) => s.customerId === customer.id) || [];
    const products = crmData.products?.filter((p: any) => p.customerId === customer.id) || [];

    return `${customer.name} (Phase: ${customer.phase || 'Unknown'}, Processes: ${processes.length}, Teams: ${teams.length}, Services: ${services.length}, Products: ${products.length})`;
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

  // Generate pharmaceutical product details by therapeutic area
  const productDetailsByTherapeuticArea = new Map<string, { count: number, products: string[] }>();
  if (crmData.products) {
    crmData.products.forEach((product: any) => {
      const therapeuticArea = product.therapeuticArea || 'Unknown';
      if (!productDetailsByTherapeuticArea.has(therapeuticArea)) {
        productDetailsByTherapeuticArea.set(therapeuticArea, { count: 0, products: [] });
      }
      const details = productDetailsByTherapeuticArea.get(therapeuticArea)!;
      details.count++;
      details.products.push(`${product.name} (${product.drugClass || 'Unknown Class'}, ${product.regulatoryStatus || 'Unknown Status'})`);
    });
  }

  const productDetailsText = Array.from(productDetailsByTherapeuticArea.entries())
    .map(([area, details]) => `${area} (${details.count} products: ${details.products.join(', ')})`)
    .join('\n');

  // Format cross-team product assignments
  const crossTeamProductsText = crossTeamProducts.length > 0
    ? crossTeamProducts.map(product => `${product.name} (${product.teamCount} teams: ${product.teams})`).join('\n')
    : "No products currently assigned to multiple teams";

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

### Pharmaceutical Product Statistics
- Total Products: ${productCount}
- Product Activity Status: ${Object.entries(productActivityStatus).map(([status, count]) => `${status}: ${count}`).join(', ')}
- Therapeutic Area Distribution: ${Object.entries(therapeuticAreaDistribution).map(([area, count]) => `${area}: ${count}`).join(', ')}
- Drug Class Distribution: ${Object.entries(drugClassDistribution).map(([drugClass, count]) => `${drugClass}: ${count}`).join(', ')}
- Regulatory Status Distribution: ${Object.entries(regulatoryStatusDistribution).map(([status, count]) => `${status}: ${count}`).join(', ')}
- Team Responsibility Distribution: ${Object.entries(responsibilityLevelDistribution).map(([level, count]) => `${level}: ${count}`).join(', ')}
- Cross-Team Products: ${crossTeamProducts.length} products managed by multiple teams

### Additional Data Statistics
- Total Contacts: ${contactCount}
- Total Documents: ${documentCount}

## DETAILED CUSTOMER INFORMATION
${customerDetails}

## TEAM DETAILS
${teamDetailsText || 'No teams available'}

## SERVICE DETAILS
${serviceDetailsText || 'No services available'}

## PHARMACEUTICAL PRODUCT PORTFOLIO
${productDetailsText || 'No pharmaceutical products available'}

## CROSS-TEAM PRODUCT MANAGEMENT
${crossTeamProductsText}

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
