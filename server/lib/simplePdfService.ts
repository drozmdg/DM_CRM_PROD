/**
 * Simple PDF Generation Service - Fallback for environments where Puppeteer doesn't work
 * Uses jsPDF for creating PDFs without browser automation
 */

import { jsPDF } from 'jspdf';
import { CustomerReportData } from '../../shared/types/reports.js';

export class SimplePDFService {
  
  /**
   * Generate a simple customer report PDF using jsPDF
   */
  async generateCustomerReport(
    reportData: CustomerReportData,
    options: any = {}
  ): Promise<Buffer> {
    try {
      console.log('📄 Generating simple PDF report...');
      console.log('📄 Customer:', reportData.customer.name);
      console.log('📄 Options:', JSON.stringify(options));
      
      // Create new PDF document
      const doc = new jsPDF({
        orientation: options.orientation || 'portrait',
        unit: 'mm',
        format: options.format?.toLowerCase() || 'a4'
      });

      let yPosition = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;

      // Title
      doc.setFontSize(24);
      doc.setTextColor(0, 122, 204); // Blue color
      doc.text(`Customer Report: ${reportData.customer.name}`, margin, yPosition);
      yPosition += 15;

      // Add line under title
      doc.setDrawColor(0, 122, 204);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Customer Information Section
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Customer Information', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      const customerInfo = [
        `Name: ${reportData.customer.name}`,
        `Phase: ${reportData.customer.phase}`,
        `Status: ${reportData.customer.active ? 'Active' : 'Inactive'}`,
        `Contract Start: ${reportData.customer.contractStartDate || 'Not set'}`,
        `Contract End: ${reportData.customer.contractEndDate || 'Not set'}`,
        `Created: ${new Date(reportData.customer.createdAt).toLocaleDateString()}`
      ];

      customerInfo.forEach(info => {
        doc.text(info, margin, yPosition);
        yPosition += 5;
      });

      yPosition += 5;

      // Summary Statistics
      doc.setFontSize(16);
      doc.text('Summary Statistics', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      const summaryStats = [
        `Total Processes: ${reportData.summary.totalProcesses}`,
        `Active Processes: ${reportData.summary.activeProcesses}`,
        `Completed Processes: ${reportData.summary.completedProcesses}`,
        `Total Teams: ${reportData.summary.totalTeams}`,
        `Total Services: ${reportData.summary.totalServices}`,
        `Monthly Hours: ${reportData.summary.totalMonthlyHours}`,
        `Total Contacts: ${reportData.summary.totalContacts}`,
        `Total Documents: ${reportData.summary.totalDocuments}`
      ];

      summaryStats.forEach(stat => {
        doc.text(stat, margin, yPosition);
        yPosition += 5;
      });

      yPosition += 5;

      // Analytics Section
      doc.setFontSize(16);
      doc.text('Performance Analytics', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      const analytics = [
        `Process Completion Rate: ${reportData.analytics.processCompletionRate}%`,
        `Average Progress: ${reportData.analytics.averageProgress}%`,
        `On-Time Delivery: ${reportData.analytics.onTimeDelivery}%`,
        `Service Utilization: ${reportData.analytics.serviceUtilization}%`
      ];

      analytics.forEach(metric => {
        doc.text(metric, margin, yPosition);
        yPosition += 5;
      });

      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      } else {
        yPosition += 10;
      }

      // Processes Section
      if (reportData.processes.length > 0) {
        doc.setFontSize(16);
        doc.text(`Processes (${reportData.processes.length} total)`, margin, yPosition);
        yPosition += 8;

        doc.setFontSize(8);
        reportData.processes.slice(0, 10).forEach((process, index) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          
          const processText = `${index + 1}. ${process.name} - ${process.status} (${process.progress || 0}%)`;
          doc.text(processText, margin, yPosition);
          yPosition += 4;
          
          if (process.description) {
            const description = process.description.length > 80 
              ? process.description.substring(0, 80) + '...' 
              : process.description;
            doc.text(`   ${description}`, margin + 5, yPosition);
            yPosition += 4;
          }
          yPosition += 1;
        });

        if (reportData.processes.length > 10) {
          doc.text(`... and ${reportData.processes.length - 10} more processes`, margin, yPosition);
          yPosition += 5;
        }
      }

      yPosition += 5;

      // Contacts Section
      if (reportData.contacts.length > 0) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(16);
        doc.text(`Contacts (${reportData.contacts.length} total)`, margin, yPosition);
        yPosition += 8;

        doc.setFontSize(8);
        reportData.contacts.slice(0, 10).forEach((contact, index) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          
          const contactText = `${index + 1}. ${contact.name} - ${contact.title || contact.type}`;
          doc.text(contactText, margin, yPosition);
          yPosition += 4;
          
          doc.text(`   Email: ${contact.email}`, margin + 5, yPosition);
          yPosition += 4;
          yPosition += 1;
        });

        if (reportData.contacts.length > 10) {
          doc.text(`... and ${reportData.contacts.length - 10} more contacts`, margin, yPosition);
          yPosition += 5;
        }
      }

      // Services Section
      if (reportData.services.length > 0) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(16);
        doc.text(`Services (${reportData.services.length} total)`, margin, yPosition);
        yPosition += 8;

        doc.setFontSize(8);
        reportData.services.forEach((service, index) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          
          const serviceText = `${index + 1}. ${service.name} - ${service.monthlyHours} hours/month`;
          doc.text(serviceText, margin, yPosition);
          yPosition += 5;
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Generated on ${new Date().toLocaleDateString()} | Sales Dashboard CRM | Page ${i} of ${pageCount}`,
          margin,
          doc.internal.pageSize.getHeight() - 10
        );
      }

      // Return PDF as Buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      console.log(`✅ Simple PDF generated successfully, size: ${pdfBuffer.length} bytes`);
      
      return pdfBuffer;

    } catch (error) {
      console.error('❌ Error generating simple PDF:', error);
      throw new Error(`Failed to generate simple PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const simplePdfService = new SimplePDFService();