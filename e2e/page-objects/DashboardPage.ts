import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly navigation: Locator;
  readonly customersLink: Locator;
  readonly processesLink: Locator;
  readonly servicesLink: Locator;
  readonly documentsLink: Locator;
  readonly dashboardContent: Locator;

  constructor(page: Page) {
    this.page = page;
    this.navigation = page.locator('nav, [role="navigation"]');
    this.customersLink = page.locator('text=/customers/i, a[href*="/customers"]').first();
    this.processesLink = page.locator('text=/processes/i, a[href*="/processes"]').first();
    this.servicesLink = page.locator('text=/services/i, a[href*="/services"]').first();
    this.documentsLink = page.locator('text=/documents/i, a[href*="/documents"]').first();
    this.dashboardContent = page.locator('text=/dashboard|welcome|metrics/i');
  }

  async goto() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToCustomers() {
    await this.customersLink.click();
    await this.page.waitForTimeout(1000);
  }

  async navigateToProcesses() {
    await this.processesLink.click();
    await this.page.waitForTimeout(1000);
  }

  async navigateToServices() {
    await this.servicesLink.click();
    await this.page.waitForTimeout(1000);
  }

  async navigateToDocuments() {
    await this.documentsLink.click();
    await this.page.waitForTimeout(1000);
  }

  async isOnDashboard() {
    const url = this.page.url();
    const hasContent = await this.dashboardContent.isVisible();
    return url.includes('dashboard') || hasContent;
  }

  async hasNavigation() {
    return await this.navigation.isVisible();
  }
}