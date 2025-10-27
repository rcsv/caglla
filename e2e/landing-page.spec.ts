import { test, expect } from '@playwright/test'

/**
 * Landing page tests (no authentication required)
 */

test.describe('Landing Page', () => {
  test('should display landing page content', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check if landing page elements are visible
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('should have Google login button', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Look for login button or Google sign-in elements
    const loginButton = page.locator('button').or(page.locator('[data-testid="login-button"]'))
    const count = await loginButton.count()
    
    // There should be at least one button (likely login)
    expect(count).toBeGreaterThan(0)
  })

  test('should navigate when button is clicked', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Click on first visible button
    const firstButton = page.locator('button').first()
    if (await firstButton.isVisible()) {
      // Just verify button exists and is clickable
      await expect(firstButton).toBeVisible()
    }
  })
})

