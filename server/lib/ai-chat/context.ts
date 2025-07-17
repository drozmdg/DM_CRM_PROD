/**
 * AI Chat Context
 * 
 * This file contains functions for managing CRM data context for the AI chat.
 */

import { CRMData } from './types';
import { CustomerService } from '../database/customerService.js';
import { ProcessService } from '../database/processService.js';
import { TeamService } from '../database/teamService.js';
import { ProductService } from '../database/productService.js';
import { ContactService } from '../database/contactService.js';
import { DocumentService } from '../database/documentService.js';
import { ServiceService } from '../database/serviceService.js';
import { supabase } from '../supabase.js';

// Initialize service instances
const customerService = new CustomerService();
const processService = new ProcessService();
const teamService = new TeamService();
const productService = new ProductService();
const contactService = new ContactService();
const documentService = new DocumentService();
const serviceService = new ServiceService();

// Helper functions for data loading
const getCustomers = () => customerService.getAllCustomers();
const getProcesses = () => processService.getAllProcesses();
const getTeams = () => teamService.getAllTeams();
const getServices = () => serviceService.getAllServices();
const getProducts = () => productService.getAllProducts();
const getContacts = () => contactService.getAllContacts();
const getDocuments = () => documentService.getAllDocuments();

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
    const [customers, processes, teams, services, products, contacts, documents] = await Promise.all([
      getCustomers(),
      getProcesses(),
      getTeams(),
      getServices(),
      getProducts(),
      getContacts(),
      getDocuments()
    ]);

    // Enrich customers with their related entities
    const enrichedCustomers = customers.map(customer => {
      const customerProducts = products.filter(product => product.customerId === customer.id);
      return {
        ...customer,
        processes: processes.filter(process => process.customerId === customer.id),
        teams: teams.filter(team => team.customerId === customer.id),
        services: services.filter(service => service.customerId === customer.id),
        products: customerProducts,
        contacts: contacts.filter(contact => contact.customerId === customer.id),
        documents: documents.filter(document => document.customerId === customer.id)
      };
    });

    setCRMData({ 
      customers: enrichedCustomers, 
      processes, 
      teams, 
      services, 
      products, 
      contacts, 
      documents 
    });
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
  const productCount = crmData.products?.length || 0;
  const contactCount = crmData.contacts?.length || 0;
  const documentCount = crmData.documents?.length || 0;

  // Count processes by status and SDLC stage
  const processStatusCounts: Record<string, number> = {};
  const processStageDistribution: Record<string, number> = {};
  const processFunctionalAreaDistribution: Record<string, number> = {};
  const processApprovalStatusDistribution: Record<string, number> = {};
  let totalProcesses = 0;

  // Pharmaceutical product statistics
  const therapeuticAreaDistribution: Record<string, number> = {};
  const drugClassDistribution: Record<string, number> = {};
  const regulatoryStatusDistribution: Record<string, number> = {};
  const responsibilityLevelDistribution: Record<string, number> = {};
  const productActivityStatus: Record<string, number> = {};
  const crossTeamProducts: any[] = [];

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

  // Get customer details for the prompt
  const customerDetails = crmData.customers.map((customer: any) => {
    const processCount = customer.processes ? customer.processes.length : 0;
    const teamCount = customer.teams ? customer.teams.length : 0;
    const serviceCount = customer.services ? customer.services.length : 0;
    const productCount = customer.products ? customer.products.length : 0;

    return `${customer.name} (Phase: ${customer.phase || 'Unknown'}, Processes: ${processCount}, Teams: ${teamCount}, Services: ${serviceCount}, Products: ${productCount})`;
  }).join('\n');

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
Be helpful, detailed, and accurate in your responses.
`.trim();
};
