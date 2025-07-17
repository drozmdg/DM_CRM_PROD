/**
 * PDF Generation Service
 * Handles comprehensive customer report generation using Puppeteer
 */

import puppeteer, { Browser } from 'puppeteer';
import { CustomerReportData } from '../../shared/types/reports.js';

export class PDFService {
  private browser: Browser | null = null;

  /**
   * Initialize the PDF service with a browser instance
   */
  async initialize(): Promise<void> {
    if (!this.browser) {
      try {
        console.log('🚀 Initializing Puppeteer browser...');
        
        // Check for available Chrome installations in WSL/Windows environment
        const possiblePaths = [
          '/home/mike/.cache/puppeteer/chrome/linux-138.0.7204.92/chrome-linux64/chrome',
          '/mnt/c/Users/mdg/.cache/puppeteer/chrome/linux-138.0.7204.92/chrome-linux64/chrome',
          // Add fallback for system Chrome
          '/usr/bin/google-chrome',
          '/usr/bin/chromium-browser'
        ];
        
        let executablePath: string | undefined;
        
        // Try to find an existing Chrome installation
        for (const path of possiblePaths) {
          try {
            const fs = await import('fs');
            if (fs.existsSync(path)) {
              executablePath = path;
              console.log(`📍 Found Chrome at: ${path}`);
              break;
            }
          } catch (e) {
            // Continue to next path
          }
        }
        
        const launchOptions: any = {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
          ]
        };
        
        if (executablePath) {
          launchOptions.executablePath = executablePath;
        }
        
        this.browser = await puppeteer.launch(launchOptions);
        console.log('✅ PDF Service initialized with browser instance');
      } catch (error) {
        console.error('❌ Failed to initialize Puppeteer:', error);
        throw new Error(`Failed to initialize PDF service: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Close the browser instance
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('🧹 PDF Service browser instance closed');
    }
  }

  /**
   * Generate a comprehensive customer report PDF
   */
  async generateCustomerReport(
    reportData: CustomerReportData,
    options: {
      includeCharts?: boolean;
      dateRange?: { start: string; end: string };
      sections?: string[];
      format?: 'A4' | 'Letter';
      orientation?: 'portrait' | 'landscape';
    } = {}
  ): Promise<Buffer> {
    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.browser!.newPage();
    
    try {
      // Set viewport for consistent rendering
      await page.setViewport({ width: 1200, height: 800 });

      // Generate HTML content for the report
      console.log('📄 Generating HTML content...');
      const htmlContent = this.generateSimpleTestHTML(reportData);

      // Set the HTML content
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Generate PDF with specified options
      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        landscape: options.orientation === 'landscape',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        },
        displayHeaderFooter: true,
        headerTemplate: this.getHeaderTemplate(reportData.customer.name),
        footerTemplate: this.getFooterTemplate(),
        preferCSSPageSize: true
      });

      console.log(`✅ Generated PDF report for customer: ${reportData.customer.name}`);
      return pdfBuffer;

    } catch (error) {
      console.error('❌ Error generating PDF report:', error);
      throw new Error(`Failed to generate PDF report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      await page.close();
    }
  }

  /**
   * Generate simple test HTML for debugging
   */
  private generateSimpleTestHTML(data: CustomerReportData): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Customer Report - ${data.customer.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #333; border-bottom: 2px solid #007acc; padding-bottom: 10px; }
          h2 { color: #555; margin-top: 30px; }
          .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .stat { display: inline-block; margin: 10px 20px 10px 0; }
          .stat-value { font-size: 24px; font-weight: bold; color: #007acc; }
          .stat-label { font-size: 14px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Customer Report: ${data.customer.name}</h1>
        
        <div class="summary">
          <h2>Summary</h2>
          <div class="stat">
            <div class="stat-value">${data.summary.totalProcesses}</div>
            <div class="stat-label">Total Processes</div>
          </div>
          <div class="stat">
            <div class="stat-value">${data.summary.activeProcesses}</div>
            <div class="stat-label">Active Processes</div>
          </div>
          <div class="stat">
            <div class="stat-value">${data.summary.totalContacts}</div>
            <div class="stat-label">Contacts</div>
          </div>
          <div class="stat">
            <div class="stat-value">${data.summary.totalDocuments}</div>
            <div class="stat-label">Documents</div>
          </div>
        </div>

        <h2>Customer Information</h2>
        <table>
          <tr><th>Name</th><td>${data.customer.name}</td></tr>
          <tr><th>Phase</th><td>${data.customer.phase}</td></tr>
          <tr><th>Active</th><td>${data.customer.active ? 'Yes' : 'No'}</td></tr>
          <tr><th>Contract Start</th><td>${data.customer.contractStartDate || 'Not set'}</td></tr>
          <tr><th>Contract End</th><td>${data.customer.contractEndDate || 'Not set'}</td></tr>
        </table>

        <h2>Analytics</h2>
        <table>
          <tr><th>Process Completion Rate</th><td>${data.analytics.processCompletionRate}%</td></tr>
          <tr><th>Average Progress</th><td>${data.analytics.averageProgress}%</td></tr>
          <tr><th>On-Time Delivery</th><td>${data.analytics.onTimeDelivery}%</td></tr>
          <tr><th>Service Utilization</th><td>${data.analytics.serviceUtilization}%</td></tr>
        </table>

        <h2>Processes (${data.processes.length} total)</h2>
        <table>
          <tr><th>Name</th><th>Status</th><th>SDLC Stage</th><th>Progress</th></tr>
          ${data.processes.slice(0, 10).map(process => `
            <tr>
              <td>${process.name}</td>
              <td>${process.status}</td>
              <td>${process.sdlcStage}</td>
              <td>${process.progress || 0}%</td>
            </tr>
          `).join('')}
        </table>

        <h2>Contacts (${data.contacts.length} total)</h2>
        <table>
          <tr><th>Name</th><th>Title</th><th>Email</th><th>Type</th></tr>
          ${data.contacts.slice(0, 10).map(contact => `
            <tr>
              <td>${contact.name}</td>
              <td>${contact.title || 'N/A'}</td>
              <td>${contact.email}</td>
              <td>${contact.type}</td>
            </tr>
          `).join('')}
        </table>

        <footer style="margin-top: 50px; text-align: center; color: #666; font-size: 12px;">
          Generated on ${new Date().toLocaleDateString()} | Sales Dashboard CRM
        </footer>
      </body>
      </html>
    `;
  }

  /**
   * Generate the complete HTML content for the customer report
   */
  private generateReportHTML(
    data: CustomerReportData,
    options: any
  ): string {
    const styles = this.getReportStyles();
    const sections = this.getEnabledSections(options.sections);

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Customer Report - ${data.customer.name}</title>
        <style>${styles}</style>
      </head>
      <body>
        <div class="report-container">
          ${this.generateCoverPage(data)}
          ${sections.includes('executive') ? this.generateExecutiveSummary(data) : ''}
          ${sections.includes('customer') ? this.generateCustomerInformation(data) : ''}
          ${sections.includes('teams') ? this.generateTeamsAndServices(data) : ''}
          ${sections.includes('processes') ? this.generateProcessManagement(data) : ''}
          ${sections.includes('compliance') ? this.generateComplianceSection(data) : ''}
          ${sections.includes('communication') ? this.generateCommunicationSection(data) : ''}
          ${sections.includes('portfolio') ? this.generatePortfolioSection(data) : ''}
          ${sections.includes('analytics') ? this.generateAnalyticsSection(data) : ''}
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate cover page HTML
   */
  private generateCoverPage(data: CustomerReportData): string {
    const currentDate = new Date().toLocaleDateString();
    
    return `
      <div class="cover-page">
        <div class="cover-header">
          <div class="company-logo">
            <div class="logo-placeholder" style="background-color: ${data.customer.avatarColor || '#1976D2'}">
              ${data.customer.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <h1 class="report-title">Comprehensive Client Report</h1>
          <h2 class="customer-name">${data.customer.name}</h2>
        </div>
        
        <div class="cover-summary">
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-value">${data.summary.totalProcesses}</div>
              <div class="summary-label">Total Processes</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${data.summary.activeProcesses}</div>
              <div class="summary-label">Active Processes</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${data.summary.totalTeams}</div>
              <div class="summary-label">Teams</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${data.summary.totalServices}</div>
              <div class="summary-label">Services</div>
            </div>
          </div>
        </div>
        
        <div class="cover-footer">
          <p>Report Generated: ${currentDate}</p>
          <p>Customer Phase: ${data.customer.phase}</p>
          <p>Contract: ${data.customer.contractStartDate || 'N/A'} - ${data.customer.contractEndDate || 'N/A'}</p>
        </div>
      </div>
      <div class="page-break"></div>
    `;
  }

  /**
   * Generate executive summary section
   */
  private generateExecutiveSummary(data: CustomerReportData): string {
    return `
      <div class="section">
        <h2 class="section-title">Executive Summary</h2>
        
        <div class="summary-overview">
          <p class="overview-text">
            ${data.customer.name} is currently in the <strong>${data.customer.phase}</strong> phase. 
            The customer has <strong>${data.summary.totalProcesses}</strong> total processes, 
            with <strong>${data.summary.activeProcesses}</strong> currently active. 
            Our team provides <strong>${data.summary.totalServices}</strong> services 
            supported by <strong>${data.summary.totalTeams}</strong> dedicated teams.
          </p>
        </div>

        <div class="metrics-grid">
          <div class="metric-card">
            <h3>Process Completion Rate</h3>
            <div class="metric-value">${data.analytics.processCompletionRate}%</div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${data.analytics.processCompletionRate}%"></div>
            </div>
          </div>
          
          <div class="metric-card">
            <h3>Service Utilization</h3>
            <div class="metric-value">${data.analytics.serviceUtilization}%</div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${data.analytics.serviceUtilization}%"></div>
            </div>
          </div>
          
          <div class="metric-card">
            <h3>Total Monthly Hours</h3>
            <div class="metric-value">${data.summary.totalMonthlyHours}</div>
            <div class="metric-label">hours committed</div>
          </div>
        </div>
      </div>
      <div class="page-break"></div>
    `;
  }

  /**
   * Generate customer information section
   */
  private generateCustomerInformation(data: CustomerReportData): string {
    return `
      <div class="section">
        <h2 class="section-title">Customer Information</h2>
        
        <div class="info-grid">
          <div class="info-section">
            <h3>Company Details</h3>
            <table class="info-table">
              <tr><td>Company Name:</td><td>${data.customer.name}</td></tr>
              <tr><td>Phase:</td><td>${data.customer.phase}</td></tr>
              <tr><td>Status:</td><td>${data.customer.active ? 'Active' : 'Inactive'}</td></tr>
              <tr><td>Contract Start:</td><td>${data.customer.contractStartDate || 'N/A'}</td></tr>
              <tr><td>Contract End:</td><td>${data.customer.contractEndDate || 'N/A'}</td></tr>
            </table>
          </div>
          
          <div class="info-section">
            <h3>Primary Contacts</h3>
            <div class="contacts-list">
              ${data.contacts.slice(0, 5).map(contact => `
                <div class="contact-item">
                  <strong>${contact.name}</strong> - ${contact.title || contact.type}<br>
                  <span class="contact-details">${contact.email} | ${contact.phone || 'N/A'}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        
        ${data.importantDates && data.importantDates.length > 0 ? `
          <div class="important-dates">
            <h3>Important Dates</h3>
            <div class="dates-grid">
              ${data.importantDates!.map(date => `
                <div class="date-item">
                  <div class="date-value">${new Date(date.date).toLocaleDateString()}</div>
                  <div class="date-description">${date.description}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
      <div class="page-break"></div>
    `;
  }

  /**
   * Generate teams and services section
   */
  private generateTeamsAndServices(data: CustomerReportData): string {
    return `
      <div class="section">
        <h2 class="section-title">Teams & Services</h2>
        
        <div class="teams-services-grid">
          <div class="teams-section">
            <h3>Team Assignments</h3>
            <div class="teams-list">
              ${data.teams.map(team => `
                <div class="team-item">
                  <div class="team-header">
                    <strong>${team.name}</strong>
                    <span class="finance-code">${team.financeCode}</span>
                  </div>
                  <div class="team-dates">
                    ${team.startDate ? `Start: ${new Date(team.startDate).toLocaleDateString()}` : ''}
                    ${team.endDate ? ` | End: ${new Date(team.endDate).toLocaleDateString()}` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="services-section">
            <h3>Service Catalog</h3>
            <div class="services-list">
              ${data.services.map(service => `
                <div class="service-item">
                  <div class="service-name">${service.name}</div>
                  <div class="service-hours">${service.monthlyHours} hours/month</div>
                </div>
              `).join('')}
            </div>
            
            <div class="service-summary">
              <strong>Total Monthly Commitment: ${data.summary.totalMonthlyHours} hours</strong>
            </div>
          </div>
        </div>
      </div>
      <div class="page-break"></div>
    `;
  }

  /**
   * Generate process management section
   */
  private generateProcessManagement(data: CustomerReportData): string {
    return `
      <div class="section">
        <h2 class="section-title">Process Management</h2>
        
        <div class="processes-overview">
          <div class="process-stats">
            <div class="stat-item">
              <span class="stat-value">${data.processes.filter(p => p.status === 'Active').length}</span>
              <span class="stat-label">Active</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${data.processes.filter(p => p.status === 'Completed').length}</span>
              <span class="stat-label">Completed</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${data.processes.filter(p => p.isTpaRequired).length}</span>
              <span class="stat-label">With TPA</span>
            </div>
          </div>
        </div>
        
        <div class="processes-list">
          ${data.processes.map(process => `
            <div class="process-item">
              <div class="process-header">
                <h4>${process.name}</h4>
                <span class="process-status status-${process.status.toLowerCase().replace(' ', '-')}">${process.status}</span>
              </div>
              <div class="process-details">
                <div class="process-info">
                  <span><strong>SDLC Stage:</strong> ${process.sdlcStage}</span>
                  <span><strong>Start Date:</strong> ${new Date(process.startDate).toLocaleDateString()}</span>
                  ${process.dueDate ? `<span><strong>Due Date:</strong> ${new Date(process.dueDate).toLocaleDateString()}</span>` : ''}
                </div>
                ${process.description ? `<p class="process-description">${process.description}</p>` : ''}
                ${process.isTpaRequired ? `
                  <div class="tpa-info">
                    <strong>TPA Required:</strong> Yes | 
                    <strong>Data Source:</strong> ${process.tpaDataSource || 'N/A'} | 
                    <strong>TPA Period:</strong> ${process.tpaStartDate || 'N/A'} - ${process.tpaEndDate || 'N/A'}
                  </div>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="page-break"></div>
    `;
  }

  /**
   * Generate compliance section
   */
  private generateComplianceSection(data: CustomerReportData): string {
    const tpaProcesses = data.processes.filter(p => p.isTpaRequired);
    
    return `
      <div class="section">
        <h2 class="section-title">Data Integration & Compliance</h2>
        
        <div class="compliance-overview">
          <div class="compliance-stats">
            <div class="compliance-item">
              <span class="compliance-value">${tpaProcesses.length}</span>
              <span class="compliance-label">TPA Agreements</span>
            </div>
            <div class="compliance-item">
              <span class="compliance-value">${data.fileTransfers?.length || 0}</span>
              <span class="compliance-label">File Transfer Configs</span>
            </div>
          </div>
        </div>
        
        ${tpaProcesses.length > 0 ? `
          <div class="tpa-section">
            <h3>TPA Agreements</h3>
            <div class="tpa-list">
              ${tpaProcesses.map(process => `
                <div class="tpa-item">
                  <div class="tpa-header">
                    <strong>${process.name}</strong>
                    <span class="tpa-status ${new Date(process.tpaEndDate || '') < new Date() ? 'expired' : 'active'}">
                      ${new Date(process.tpaEndDate || '') < new Date() ? 'Expired' : 'Active'}
                    </span>
                  </div>
                  <div class="tpa-details">
                    <span><strong>Data Source:</strong> ${process.tpaDataSource}</span>
                    <span><strong>Period:</strong> ${process.tpaStartDate} - ${process.tpaEndDate}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
      <div class="page-break"></div>
    `;
  }

  /**
   * Generate communication section
   */
  private generateCommunicationSection(data: CustomerReportData): string {
    return `
      <div class="section">
        <h2 class="section-title">Communication & Documents</h2>
        
        <div class="communication-grid">
          <div class="contacts-section">
            <h3>All Contacts (${data.contacts.length})</h3>
            <div class="contacts-table">
              ${data.contacts.map(contact => `
                <div class="contact-row">
                  <div class="contact-info">
                    <strong>${contact.name}</strong> - ${contact.title || contact.type}
                  </div>
                  <div class="contact-details">
                    ${contact.email} | ${contact.phone || 'No phone'}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="documents-section">
            <h3>Document Library (${data.documents.length})</h3>
            <div class="documents-by-category">
              ${this.groupDocumentsByCategory(data.documents)}
            </div>
          </div>
        </div>
        
        ${data.notes && data.notes.length > 0 ? `
          <div class="notes-section">
            <h3>Recent Notes</h3>
            <div class="notes-list">
              ${data.notes.slice(0, 5).map(note => `
                <div class="note-item">
                  <div class="note-date">${new Date(note.createdAt).toLocaleDateString()}</div>
                  <div class="note-content">${note.noteContent}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
      <div class="page-break"></div>
    `;
  }

  /**
   * Generate portfolio section
   */
  private generatePortfolioSection(data: CustomerReportData): string {
    return `
      <div class="section">
        <h2 class="section-title">Pharmaceutical Portfolio</h2>
        
        ${data.products && data.products.length > 0 ? `
          <div class="products-overview">
            <div class="product-stats">
              <div class="stat-item">
                <span class="stat-value">${data.products.length}</span>
                <span class="stat-label">Total Products</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">${data.products.filter(p => p.regulatoryStatus === 'Approved').length}</span>
                <span class="stat-label">Approved</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">${data.products.filter(p => p.isActive).length}</span>
                <span class="stat-label">Active</span>
              </div>
            </div>
          </div>
          
          <div class="products-list">
            ${data.products.map(product => `
              <div class="product-item">
                <div class="product-header">
                  <h4>${product.name}</h4>
                  <span class="regulatory-status">${product.regulatoryStatus}</span>
                </div>
                <div class="product-details">
                  ${product.therapeuticArea ? `<span><strong>Therapeutic Area:</strong> ${product.therapeuticArea}</span>` : ''}
                  ${product.drugClass ? `<span><strong>Drug Class:</strong> ${product.drugClass}</span>` : ''}
                  ${product.indication ? `<span><strong>Indication:</strong> ${product.indication}</span>` : ''}
                </div>
                ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="no-products">
            <p>No pharmaceutical products on file for this customer.</p>
          </div>
        `}
      </div>
      <div class="page-break"></div>
    `;
  }

  /**
   * Generate analytics section
   */
  private generateAnalyticsSection(data: CustomerReportData): string {
    return `
      <div class="section">
        <h2 class="section-title">Analytics & Metrics</h2>
        
        <div class="analytics-grid">
          <div class="analytics-section">
            <h3>Process Performance</h3>
            <div class="metrics-list">
              <div class="metric-row">
                <span>Completion Rate</span>
                <span>${data.analytics.processCompletionRate}%</span>
              </div>
              <div class="metric-row">
                <span>Average Progress</span>
                <span>${data.analytics.averageProgress}%</span>
              </div>
              <div class="metric-row">
                <span>On-Time Delivery</span>
                <span>${data.analytics.onTimeDelivery}%</span>
              </div>
            </div>
          </div>
          
          <div class="analytics-section">
            <h3>Service Metrics</h3>
            <div class="metrics-list">
              <div class="metric-row">
                <span>Service Utilization</span>
                <span>${data.analytics.serviceUtilization}%</span>
              </div>
              <div class="metric-row">
                <span>Total Monthly Hours</span>
                <span>${data.summary.totalMonthlyHours}</span>
              </div>
              <div class="metric-row">
                <span>Active Services</span>
                <span>${data.services.length}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="timeline-section">
          <h3>Recent Activity Timeline</h3>
          <div class="timeline-list">
            ${data.recentActivity?.map(activity => `
              <div class="timeline-item">
                <div class="timeline-date">${new Date(activity.date).toLocaleDateString()}</div>
                <div class="timeline-content">
                  <strong>${activity.type}:</strong> ${activity.description}
                </div>
              </div>
            `).join('') || '<p>No recent activity recorded.</p>'}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Helper function to group documents by category
   */
  private groupDocumentsByCategory(documents: any[]): string {
    const categories = documents.reduce((acc, doc) => {
      const category = doc.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(doc);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(categories).map(([category, docs]) => `
      <div class="category-section">
        <h4>${category} (${docs.length})</h4>
        <div class="category-docs">
          ${docs.slice(0, 5).map(doc => `
            <div class="doc-item">${doc.name}</div>
          `).join('')}
          ${docs.length > 5 ? `<div class="doc-item more">... and ${docs.length - 5} more</div>` : ''}
        </div>
      </div>
    `).join('');
  }

  /**
   * Get enabled sections based on options
   */
  private getEnabledSections(sections?: string[]): string[] {
    const defaultSections = [
      'executive', 'customer', 'teams', 'processes', 
      'compliance', 'communication', 'portfolio', 'analytics'
    ];
    return sections && sections.length > 0 ? sections : defaultSections;
  }

  /**
   * Get header template for PDF
   */
  private getHeaderTemplate(customerName: string): string {
    return `
      <div style="font-size: 10px; padding: 5px 20px; width: 100%; display: flex; justify-content: space-between; align-items: center;">
        <span>Customer Report - ${customerName}</span>
        <span>Sales Dashboard CRM</span>
      </div>
    `;
  }

  /**
   * Get footer template for PDF
   */
  private getFooterTemplate(): string {
    return `
      <div style="font-size: 10px; padding: 5px 20px; width: 100%; text-align: center;">
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `;
  }

  /**
   * Get comprehensive CSS styles for the report
   */
  private getReportStyles(): string {
    return `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.4;
        color: #333;
        background: white;
      }
      
      .report-container {
        max-width: 100%;
        margin: 0 auto;
      }
      
      .page-break {
        page-break-before: always;
      }
      
      /* Cover Page Styles */
      .cover-page {
        height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        text-align: center;
        padding: 40px;
      }
      
      .cover-header {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
      
      .logo-placeholder {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 48px;
        font-weight: bold;
        color: white;
        margin-bottom: 30px;
      }
      
      .report-title {
        font-size: 36px;
        margin-bottom: 10px;
        color: #1976D2;
      }
      
      .customer-name {
        font-size: 28px;
        margin-bottom: 40px;
        color: #666;
      }
      
      .cover-summary {
        margin: 40px 0;
      }
      
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 30px;
        max-width: 600px;
        margin: 0 auto;
      }
      
      .summary-item {
        text-align: center;
      }
      
      .summary-value {
        font-size: 32px;
        font-weight: bold;
        color: #1976D2;
        margin-bottom: 5px;
      }
      
      .summary-label {
        font-size: 14px;
        color: #666;
      }
      
      .cover-footer {
        font-size: 16px;
        color: #666;
        line-height: 1.6;
      }
      
      /* Section Styles */
      .section {
        padding: 30px;
        margin-bottom: 20px;
      }
      
      .section-title {
        font-size: 24px;
        color: #1976D2;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 2px solid #1976D2;
      }
      
      /* Grid Layouts */
      .info-grid, .teams-services-grid, .communication-grid, .analytics-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        margin-bottom: 20px;
      }
      
      .info-section, .teams-section, .services-section, .contacts-section, .documents-section, .analytics-section {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
      }
      
      .info-section h3, .teams-section h3, .services-section h3, .contacts-section h3, .documents-section h3, .analytics-section h3 {
        font-size: 18px;
        margin-bottom: 15px;
        color: #333;
      }
      
      /* Tables */
      .info-table {
        width: 100%;
        border-collapse: collapse;
      }
      
      .info-table td {
        padding: 8px 0;
        border-bottom: 1px solid #eee;
      }
      
      .info-table td:first-child {
        font-weight: 500;
        width: 40%;
      }
      
      /* Metrics and Progress */
      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        margin: 20px 0;
      }
      
      .metric-card {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
      }
      
      .metric-card h3 {
        font-size: 14px;
        margin-bottom: 10px;
        color: #666;
      }
      
      .metric-value {
        font-size: 32px;
        font-weight: bold;
        color: #1976D2;
        margin-bottom: 10px;
      }
      
      .metric-label {
        font-size: 12px;
        color: #666;
      }
      
      .progress-bar {
        width: 100%;
        height: 8px;
        background: #e0e0e0;
        border-radius: 4px;
        overflow: hidden;
      }
      
      .progress-fill {
        height: 100%;
        background: #1976D2;
        transition: width 0.3s ease;
      }
      
      /* Process Items */
      .process-item {
        background: #f8f9fa;
        padding: 20px;
        margin-bottom: 15px;
        border-radius: 8px;
        border-left: 4px solid #1976D2;
      }
      
      .process-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }
      
      .process-header h4 {
        font-size: 18px;
        color: #333;
      }
      
      .process-status {
        padding: 4px 12px;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
      }
      
      .status-active { background: #e8f5e8; color: #2e7d32; }
      .status-completed { background: #e3f2fd; color: #1976d2; }
      .status-not-started { background: #fff3e0; color: #f57c00; }
      .status-in-progress { background: #f3e5f5; color: #7b1fa2; }
      
      .process-info {
        display: flex;
        gap: 20px;
        margin-bottom: 10px;
        font-size: 14px;
      }
      
      .process-description {
        margin: 10px 0;
        color: #666;
        font-size: 14px;
      }
      
      .tpa-info {
        background: #fff3e0;
        padding: 10px;
        border-radius: 4px;
        font-size: 14px;
        margin-top: 10px;
      }
      
      /* Lists */
      .teams-list, .services-list, .contacts-list {
        space-y: 10px;
      }
      
      .team-item, .service-item, .contact-item {
        padding: 12px;
        background: white;
        border-radius: 6px;
        margin-bottom: 8px;
      }
      
      .team-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px;
      }
      
      .finance-code {
        background: #e3f2fd;
        color: #1976d2;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
      }
      
      .team-dates, .contact-details {
        font-size: 12px;
        color: #666;
      }
      
      .service-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .service-hours {
        font-weight: 500;
        color: #1976d2;
      }
      
      /* Statistics */
      .process-stats, .compliance-stats, .product-stats {
        display: flex;
        justify-content: center;
        gap: 40px;
        margin: 20px 0;
      }
      
      .stat-item, .compliance-item {
        text-align: center;
      }
      
      .stat-value, .compliance-value {
        font-size: 24px;
        font-weight: bold;
        color: #1976D2;
      }
      
      .stat-label, .compliance-label {
        font-size: 12px;
        color: #666;
        margin-top: 5px;
      }
      
      /* Compliance */
      .tpa-item {
        background: #f8f9fa;
        padding: 15px;
        margin-bottom: 10px;
        border-radius: 6px;
      }
      
      .tpa-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      
      .tpa-status.active { color: #2e7d32; }
      .tpa-status.expired { color: #d32f2f; }
      
      .tpa-details {
        font-size: 14px;
        color: #666;
      }
      
      /* Documents */
      .contacts-table {
        max-height: 300px;
        overflow-y: auto;
      }
      
      .contact-row {
        padding: 10px 0;
        border-bottom: 1px solid #eee;
      }
      
      .category-section {
        margin-bottom: 15px;
      }
      
      .category-section h4 {
        font-size: 14px;
        margin-bottom: 8px;
        color: #333;
      }
      
      .doc-item {
        font-size: 12px;
        padding: 4px 0;
        color: #666;
      }
      
      .doc-item.more {
        font-style: italic;
        color: #1976d2;
      }
      
      /* Notes */
      .notes-list {
        max-height: 200px;
        overflow-y: auto;
      }
      
      .note-item {
        padding: 10px;
        background: #f8f9fa;
        margin-bottom: 8px;
        border-radius: 6px;
      }
      
      .note-date {
        font-size: 12px;
        color: #666;
        margin-bottom: 5px;
      }
      
      .note-content {
        font-size: 14px;
      }
      
      /* Products */
      .product-item {
        background: #f8f9fa;
        padding: 15px;
        margin-bottom: 15px;
        border-radius: 8px;
      }
      
      .product-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
      }
      
      .regulatory-status {
        background: #e8f5e8;
        color: #2e7d32;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
      }
      
      .product-details {
        display: flex;
        gap: 15px;
        margin-bottom: 8px;
        font-size: 14px;
      }
      
      .product-description {
        color: #666;
        font-size: 14px;
      }
      
      /* Analytics */
      .metrics-list {
        space-y: 8px;
      }
      
      .metric-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #eee;
      }
      
      .timeline-list {
        max-height: 300px;
        overflow-y: auto;
      }
      
      .timeline-item {
        display: flex;
        gap: 15px;
        padding: 10px 0;
        border-bottom: 1px solid #eee;
      }
      
      .timeline-date {
        font-size: 12px;
        color: #666;
        white-space: nowrap;
        min-width: 80px;
      }
      
      .timeline-content {
        font-size: 14px;
      }
      
      /* Utilities */
      .overview-text {
        font-size: 16px;
        line-height: 1.6;
        margin-bottom: 30px;
        color: #555;
      }
      
      .important-dates {
        margin-top: 30px;
      }
      
      .dates-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
      }
      
      .date-item {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
        text-align: center;
      }
      
      .date-value {
        font-size: 16px;
        font-weight: bold;
        color: #1976d2;
        margin-bottom: 5px;
      }
      
      .date-description {
        font-size: 14px;
        color: #666;
      }
      
      .service-summary {
        margin-top: 20px;
        padding: 15px;
        background: #e3f2fd;
        border-radius: 6px;
        text-align: center;
      }
      
      .no-products {
        text-align: center;
        padding: 40px;
        color: #666;
      }
      
      @media print {
        .page-break {
          page-break-before: always;
        }
        
        .section {
          break-inside: avoid;
        }
      }
    `;
  }
}

export const pdfService = new PDFService();