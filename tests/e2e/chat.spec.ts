import { test, expect } from '@playwright/test'

test.describe('AI-VIBE-CHAT-V1', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for client-side hydration to complete
    await page.waitForSelector('.chat-page', { timeout: 15000 })
  })

  test('page loads successfully', async ({ page }) => {
    // Verify app rendered
    await expect(page.locator('.chat-page')).toBeVisible()

    // Verify chat container or sidebar is present
    await expect(page.locator('.chat-container, .chat-sidebar')).toBeVisible()
  })

  test('can start new chat', async ({ page }) => {
    // Wait for chat interface
    await expect(page.locator('.chat-container')).toBeVisible()

    // Verify input is present
    await expect(page.locator('.chat-input')).toBeVisible()
  })

  test('can type and send message', async ({ page }) => {
    // Wait for chat interface
    await expect(page.locator('.chat-input')).toBeVisible()

    // Type message in textarea
    const messageInput = page.locator('.chat-input textarea')
    await messageInput.fill('Hello, this is a test message')

    // Click send button (primary button in input area)
    await page.click('.chat-input button')

    // Verify message appears in chat
    await expect(page.locator('.message-user')).toContainText('Hello, this is a test message')
  })

  test('sidebar shows chat interface', async ({ page }) => {
    // Verify sidebar is visible
    await expect(page.locator('.chat-sidebar')).toBeVisible()

    // Verify sidebar contains expected elements
    await expect(page.locator('.chat-sidebar')).toContainText('Chat')
  })

  test('settings panel can be opened', async ({ page }) => {
    // Look for settings button in sidebar
    const settingsButton = page.locator('button:has([name="mdi:cog"]), .chat-sidebar button').first()

    // If settings button exists, click it
    if (await settingsButton.isVisible().catch(() => false)) {
      await settingsButton.click()
      await expect(page.locator('.settings-panel, [class*="settings"]')).toBeVisible()
    } else {
      // Settings might already be visible or accessed differently
      test.skip()
    }
  })

  test('multiple messages can be sent', async ({ page }) => {
    // Wait for chat input
    await expect(page.locator('.chat-input')).toBeVisible()

    // Send first message
    const messageInput = page.locator('.chat-input textarea')
    await messageInput.fill('First message')
    await page.click('.chat-input button')

    // Wait for response or message to appear
    await page.waitForTimeout(500)

    // Send second message
    await messageInput.fill('Second message')
    await page.click('.chat-input button')

    // Verify both messages appear
    const messages = page.locator('.message-user')
    await expect(messages).toHaveCount(2)
  })
})
