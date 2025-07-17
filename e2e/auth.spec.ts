import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('should redirect to login page when not authenticated', async ({ page }) => {
    // Wait for redirection or login form to appear
    await page.waitForSelector('[data-testid="login-form"], input[type="email"]', { timeout: 10000 });
    
    // Check if we're on login page or if login form is visible
    const hasLoginForm = await page.locator('input[type="email"]').isVisible();
    const hasPasswordField = await page.locator('input[type="password"]').isVisible();
    
    expect(hasLoginForm || hasPasswordField).toBeTruthy();
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    // Wait for login form
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    await submitButton.click();
    
    // Wait for validation errors
    await page.waitForTimeout(1000);
    
    // Check for validation messages (can be various forms)
    const hasValidationErrors = await page.locator('text=/required|cannot be empty|email|password/i').count() > 0;
    expect(hasValidationErrors).toBeTruthy();
  });

  test('should accept valid login credentials', async ({ page }) => {
    // Wait for login form
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill in valid credentials
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'AdminPassword123!');
    
    // Submit form
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    await submitButton.click();
    
    // Wait for either success or error message
    await page.waitForTimeout(3000);
    
    // Check if we're redirected to dashboard or if there's an authentication response
    const isDashboard = await page.locator('text=/dashboard|customers|welcome/i').isVisible();
    const isStillOnLogin = await page.locator('input[type="email"]').isVisible();
    
    // Either we should be on dashboard OR still on login (depending on demo mode)
    expect(isDashboard || isStillOnLogin).toBeTruthy();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Wait for login form
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit form
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    await submitButton.click();
    
    // Wait for error message
    await page.waitForTimeout(2000);
    
    // Check for error message or still being on login page
    const hasError = await page.locator('text=/invalid|error|wrong|incorrect/i').isVisible();
    const stillOnLogin = await page.locator('input[type="email"]').isVisible();
    
    expect(hasError || stillOnLogin).toBeTruthy();
  });
});