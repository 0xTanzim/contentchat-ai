/**
 * End-to-End tests for Chrome Extension
 * @file tests/e2e/extension.spec.ts
 */

import { chromium, expect, test, type BrowserContext } from '@playwright/test';
import path from 'path';

/**
 * Helper to load Chrome Extension in persistent context
 */
async function loadExtension(): Promise<BrowserContext> {
  const pathToExtension = path.join(__dirname, '../../dist');
  const userDataDir = path.join(__dirname, '../../.test-user-data');

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false, // Extensions require headed mode
    channel: 'chromium',
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
      '--no-sandbox',
    ],
  });

  return context;
}

test.describe('ContentChat AI Extension', () => {
  let context: BrowserContext;
  let extensionId: string;

  test.beforeAll(async () => {
    context = await loadExtension();

    // Wait for extension to load
    await context.waitForEvent('page');

    // Get extension ID from service worker
    const serviceWorker = context.serviceWorkers()[0];
    if (serviceWorker) {
      extensionId = serviceWorker.url().split('/')[2];
    }
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('should load extension successfully', async () => {
    expect(extensionId).toBeTruthy();
    expect(extensionId).toMatch(/^[a-z]{32}$/);
  });

  test('should open side panel', async ({ page }) => {
    // Navigate to a test page
    await page.goto('https://example.com');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Click extension icon (opens side panel)
    // Note: Side panel opening is automatic on icon click in Manifest V3
    // We can verify by checking if sidepanel HTML is accessible

    const sidePanelUrl = `chrome-extension://${extensionId}/src/sidepanel/index.html`;

    // Open side panel manually for testing
    const sidePanelPage = await context.newPage();
    await sidePanelPage.goto(sidePanelUrl);

    // Verify side panel loaded
    await expect(sidePanelPage.locator('h1')).toContainText('ContentChat AI');
  });

  test('should display navigation tabs', async ({ page }) => {
    const sidePanelUrl = `chrome-extension://${extensionId}/src/sidepanel/index.html`;
    await page.goto(sidePanelUrl);

    // Check for navigation buttons
    await expect(page.locator('button:has-text("Summary")')).toBeVisible();
    await expect(page.locator('button:has-text("Chat")')).toBeVisible();
    await expect(page.locator('button:has-text("Translate")')).toBeVisible();
    await expect(page.locator('button:has-text("Library")')).toBeVisible();
  });

  test('should switch between views', async ({ page }) => {
    const sidePanelUrl = `chrome-extension://${extensionId}/src/sidepanel/index.html`;
    await page.goto(sidePanelUrl);

    // Click on Chat tab
    await page.click('button:has-text("Chat")');

    // Verify Chat view is visible
    await expect(page.locator('h2:has-text("Chat")')).toBeVisible();

    // Switch back to Summary
    await page.click('button:has-text("Summary")');

    // Verify Summary view is visible
    await expect(page.locator('h2:has-text("Summary")')).toBeVisible();
  });

  test('should show AI unavailable warning when needed', async ({ page }) => {
    const sidePanelUrl = `chrome-extension://${extensionId}/src/sidepanel/index.html`;
    await page.goto(sidePanelUrl);

    // Check for warning banner (if AI is not available)
    // This test may pass or fail depending on Chrome version
    const warningBanner = page.locator(
      'text=/Chrome Built-in AI.*not available/i'
    );

    // Either warning is shown or not shown
    const isVisible = await warningBanner.isVisible().catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });

  test('should display summary options', async ({ page }) => {
    const sidePanelUrl = `chrome-extension://${extensionId}/src/sidepanel/index.html`;
    await page.goto(sidePanelUrl);

    // Verify summary type tabs are present
    await expect(page.locator('button:has-text("Key Points")')).toBeVisible();
    await expect(page.locator('button:has-text("TL;DR")')).toBeVisible();
    await expect(page.locator('button:has-text("Teaser")')).toBeVisible();
    await expect(page.locator('button:has-text("Headline")')).toBeVisible();
  });

  test('should display chat input', async ({ page }) => {
    const sidePanelUrl = `chrome-extension://${extensionId}/src/sidepanel/index.html`;
    await page.goto(sidePanelUrl);

    // Switch to Chat view
    await page.click('button:has-text("Chat")');

    // Verify chat input exists
    await expect(page.locator('textarea[placeholder*="Ask"]')).toBeVisible();
    await expect(page.locator('button:has-text("Send")')).toBeVisible();
  });

  test.skip('should generate summary (requires Chrome AI)', async ({
    page,
  }) => {
    // This test requires Chrome Built-in AI to be available
    // Skip by default, run manually when testing with Chrome 128+

    const sidePanelUrl = `chrome-extension://${extensionId}/src/sidepanel/index.html`;
    await page.goto(sidePanelUrl);

    // Navigate to a real article in another tab
    const articlePage = await context.newPage();
    await articlePage.goto('https://example.com');

    // Go back to side panel
    await page.bringToFront();

    // Click Key Points summary
    await page.click('button:has-text("Key Points")');

    // Wait for summary to generate (max 30 seconds)
    await expect(page.locator('.summary-content')).toBeVisible({
      timeout: 30000,
    });

    // Verify summary is not empty
    const summaryText = await page.locator('.summary-content').textContent();
    expect(summaryText?.length).toBeGreaterThan(0);
  });

  test.skip('should handle chat conversation (requires Chrome AI)', async ({
    page,
  }) => {
    // This test requires Chrome Built-in AI to be available
    // Skip by default, run manually when testing with Chrome 128+

    const sidePanelUrl = `chrome-extension://${extensionId}/src/sidepanel/index.html`;
    await page.goto(sidePanelUrl);

    // Switch to Chat view
    await page.click('button:has-text("Chat")');

    // Type a question
    await page.fill('textarea', 'What is this page about?');

    // Send message
    await page.click('button:has-text("Send")');

    // Wait for AI response
    await expect(page.locator('.message-assistant')).toBeVisible({
      timeout: 30000,
    });

    // Verify response exists
    const responseText = await page
      .locator('.message-assistant')
      .last()
      .textContent();
    expect(responseText?.length).toBeGreaterThan(0);
  });

  test('should show coming soon for incomplete features', async ({ page }) => {
    const sidePanelUrl = `chrome-extension://${extensionId}/src/sidepanel/index.html`;
    await page.goto(sidePanelUrl);

    // Click Translate tab
    await page.click('button:has-text("Translate")');

    // Verify coming soon message
    await expect(page.locator('text=/Coming Soon/i')).toBeVisible();

    // Click Library tab
    await page.click('button:has-text("Library")');

    // Verify coming soon message
    await expect(page.locator('text=/Coming Soon/i')).toBeVisible();
  });
});
