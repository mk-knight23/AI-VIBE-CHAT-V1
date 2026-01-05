import { test, expect } from '@playwright/test';

test.describe('Chat Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display chat interface', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByPlaceholder('Type your message...')).toBeVisible();
  });

  test('should send a message and display user message', async ({ page }) => {
    const input = page.getByPlaceholder('Type your message...');
    const sendButton = page.getByRole('button', { name: /send/i });

    await input.fill('Hello, how are you?');
    await sendButton.click();

    // Check that user message appears
    await expect(page.getByText('Hello, how are you?')).toBeVisible({ timeout: 10000 });
  });

  test('should create new chat', async ({ page }) => {
    const newChatButton = page.getByRole('button', { name: /new chat/i });
    
    if (await newChatButton.isVisible()) {
      await newChatButton.click();
      await expect(page.getByPlaceholder('Type your message...')).toBeVisible();
    }
  });

  test('should display typing indicator during response', async ({ page }) => {
    const input = page.getByPlaceholder('Type your message...');
    const sendButton = page.getByRole('button', { name: /send/i });

    await input.fill('Tell me a short story');
    await sendButton.click();

    // Should show typing indicator (check if element exists)
    const typingIndicator = page.getByText(/typing|thinking/i);
    await expect(typingIndicator.first()).toBeVisible({ timeout: 5000 });
  });

  test('should toggle sidebar', async ({ page }) => {
    const sidebarToggle = page.getByRole('button', { name: /sidebar|toggle/i });
    
    if (await sidebarToggle.isVisible()) {
      await sidebarToggle.click();
      await expect(page.getByRole('navigation')).toBeHidden();
    }
  });
});

test.describe('Model Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display model selector', async ({ page }) => {
    const modelSelector = page.getByRole('combobox', { name: /model|select model/i });
    await expect(modelSelector).toBeVisible({ timeout: 10000 });
  });

  test('should be able to change model', async ({ page }) => {
    const modelSelector = page.getByRole('combobox', { name: /model|select model/i });
    
    await expect(modelSelector).toBeVisible({ timeout: 10000 });
    
    // Open the dropdown if not already open
    await modelSelector.click();
    
    // Check for model options
    const modelOptions = page.getByRole('option');
    const count = await modelOptions.count();
    
    if (count > 1) {
      await modelOptions.first().click();
    }
  });
});

test.describe('File Upload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display file upload button', async ({ page }) => {
    const uploadButton = page.getByRole('button', { name: /upload|attach|file/i });
    await expect(uploadButton).toBeVisible({ timeout: 10000 });
  });

  test('should accept file input', async ({ page }) => {
    // Check if file input exists
    const fileInput = page.locator('input[type=\"file\"]');
    await expect(fileInput).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display settings button', async ({ page }) => {
    const settingsButton = page.getByRole('button', { name: /settings|gear|config/i });
    await expect(settingsButton.first()).toBeVisible({ timeout: 10000 });
  });

  test('should open settings modal', async ({ page }) => {
    const settingsButton = page.getByRole('button', { name: /settings|gear|config/i });
    
    if (await settingsButton.first().isVisible()) {
      await settingsButton.first().click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should have proper heading structure', async ({ page }) => {
    const h1 = page.locator('h1');
    const h2 = page.locator('h2');
    
    // Check that at least one heading exists
    const headingCount = await page.locator('h1, h2, h3').count();
    expect(headingCount).toBeGreaterThan(0);
  });

  test('should have accessible form labels', async ({ page }) => {
    const input = page.getByPlaceholder('Type your message...');
    await expect(input).toHaveAttribute('aria-label');
  });

  test('should have keyboard accessible buttons', async ({ page }) => {
    const sendButton = page.getByRole('button', { name: /send/i }).first();
    
    // Focus should be visible
    await sendButton.focus();
    await expect(sendButton).toBeFocused();
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Main content should be visible
    await expect(page.getByPlaceholder('Type your message...')).toBeVisible({ timeout: 10000 });
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Main content should be visible
    await expect(page.getByPlaceholder('Type your message...')).toBeVisible({ timeout: 10000 });
  });
});
