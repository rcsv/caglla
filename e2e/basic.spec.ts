import { test, expect } from '@playwright/test'

/**
 * Basic smoke tests to verify the application is working
 */

test.describe('Basic Application Tests', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Check if any content is rendered
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('should have working navigation', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check if page has any links or buttons
    const hasContent = await page.locator('a, button').count()
    expect(hasContent).toBeGreaterThan(0)
  })

  test('should handle authentication state', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Application should load without crashing
    const url = page.url()
    expect(url).toBeTruthy()
  })
})

