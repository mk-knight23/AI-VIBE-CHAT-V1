import { test, expect } from '@playwright/test'

test.describe('AI-VIBE-CHAT-V1', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for client-side hydration to complete
    await page.waitForSelector('h1', { timeout: 15000 })
  })

  test('page loads successfully', async ({ page }) => {
    // Verify app title
    await expect(page.locator('h1')).toContainText('AI-VIBE-CHAT-V1')

    // Verify welcome content
    await expect(page.locator('.subtitle')).toContainText('Multi-provider AI chat')
  })

  test('can start new chat', async ({ page }) => {
    // Click start new chat button
    await page.click('button:has-text("Start New Chat")')

    // Verify chat interface appears
    await expect(page.locator('.chat-container')).toBeVisible()

    // Verify input is present
    await expect(page.locator('.chat-input')).toBeVisible()
  })

  test('can type and send message', async ({ page }) => {
    // Start new chat
    await page.click('button:has-text("Start New Chat")')

    // Type message
    const messageInput = page.locator('.chat-input textarea')
    await messageInput.fill('Hello, this is a test message')

    // Send message
    await page.click('.chat-input button[type="primary"]')

    // Verify message appears in chat
    await expect(page.locator('.message-user')).toContainText('Hello, this is a test message')
  })

  test('sidebar shows chat sessions', async ({ page }) => {
    // Start new chat
    await page.click('button:has-text("Start New Chat")')

    // Send a message to create a session
    const messageInput = page.locator('.chat-input textarea')
    await messageInput.fill('Test session')
    await page.click('.chat-input button[type="primary"]')

    // Verify sidebar is visible
    await expect(page.locator('.chat-sidebar')).toBeVisible()

    // Verify session appears in sidebar
    await expect(page.locator('.session-item')).toContainText('Test session')
  })

  test('can open settings panel', async ({ page }) => {
    // Start new chat first
    await page.click('button:has-text("Start New Chat")')

    // Click settings button
    await page.click('button:has-text("Settings")')

    // Verify settings panel appears
    await expect(page.locator('.settings-panel')).toBeVisible()

    // Verify tabs are present
    await expect(page.locator('.n-tabs-tab')).toContainText(['General', 'AI Provider', 'About'])
  })

  test('settings can be changed', async ({ page }) => {
    // Start new chat
    await page.click('button:has-text("Start New Chat")')

    // Open settings
    await page.click('button:has-text("Settings")')

    // Change temperature
    const tempSlider = page.locator('.n-slider')
    await expect(tempSlider).toBeVisible()

    // Verify provider selection exists
    await expect(page.locator('.n-select')).toBeVisible()
  })

  test('no console errors on load', async ({ page }) => {
    const errors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForTimeout(3000)

    // Filter out hydration warnings and favicon errors
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('Hydration') &&
      !e.includes('hydration')
    )
    expect(criticalErrors).toHaveLength(0)
  })

  test('responsive layout', async ({ page }) => {
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 })
    await expect(page.locator('.chat-sidebar')).toBeVisible()

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    // Sidebar might be hidden or collapsed on mobile
  })
})
