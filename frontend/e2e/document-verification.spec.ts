import { test, expect } from '@playwright/test';

test.describe('Document Verification E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('should load homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/IntegrityX/i);
  });

  test('should navigate to verification page', async ({ page }) => {
    // Click on verification link/button
    await page.click('text=Verify Document');
    await expect(page).toHaveURL(/.*verification/);
  });

  test('should upload and verify document', async ({ page }) => {
    // Navigate to upload page
    await page.goto('/upload');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Upload a test file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Test PDF content')
    });

    // Click verify button
    await page.click('button:has-text("Verify")');

    // Wait for verification to complete
    await page.waitForSelector('text=Verification Complete', { timeout: 10000 });

    // Check for success message
    await expect(page.locator('text=Document Verified')).toBeVisible();
  });

  test('should display verification results', async ({ page }) => {
    await page.goto('/verification');

    // Mock verification result
    await page.route('**/api/verify/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'verified',
          integrity: 'valid',
          blockchain_hash: 'abc123...',
          timestamp: new Date().toISOString()
        })
      });
    });

    // Trigger verification
    await page.click('button:has-text("Start Verification")');

    // Check results display
    await expect(page.locator('text=verified')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=abc123')).toBeVisible();
  });

  test('should handle verification error gracefully', async ({ page }) => {
    await page.goto('/verification');

    // Mock error response
    await page.route('**/api/verify/**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Verification failed'
        })
      });
    });

    // Trigger verification
    await page.click('button:has-text("Start Verification")');

    // Check error message
    await expect(page.locator('text=error')).toBeVisible({ timeout: 5000 });
  });

  test('should show loading state during verification', async ({ page }) => {
    await page.goto('/verification');

    // Mock slow response
    await page.route('**/api/verify/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ status: 'verified' })
      });
    });

    // Trigger verification
    await page.click('button:has-text("Start Verification")');

    // Check loading state appears
    await expect(page.locator('text=verifying')).toBeVisible();
  });
});

test.describe('Analytics Dashboard E2E', () => {
  test('should display dashboard metrics', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');

    // Check for key metrics
    await expect(page.locator('text=Total Documents')).toBeVisible();
    await expect(page.locator('text=Verified')).toBeVisible();
    await expect(page.locator('text=Success Rate')).toBeVisible();
  });

  test('should refresh dashboard data', async ({ page }) => {
    await page.goto('/dashboard');

    // Click refresh button
    await page.click('button[aria-label="Refresh"]');

    // Check for loading indicator
    await expect(page.locator('text=Loading')).toBeVisible();

    // Wait for data to load
    await page.waitForLoadState('networkidle');
  });
});

test.describe('Authentication E2E', () => {
  test('should redirect unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to sign-in
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test('should allow authenticated access', async ({ page, context }) => {
    // Set authentication cookie
    await context.addCookies([{
      name: '__session',
      value: 'test-session-token',
      domain: 'localhost',
      path: '/'
    }]);

    await page.goto('/dashboard');

    // Should stay on dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });
});














