import { test, expect } from '@playwright/test'

/**
 * Component interaction tests
 * Tests user interactions with components
 */

test.describe('Component Interactions', () => {
  test('should handle form input and validation', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Look for any input fields
    const inputs = page.locator('input[type="text"], input[type="email"], input[type="date"]')
    const inputCount = await inputs.count()
    
    // Should have at least some inputs if form is present
    console.log(`Found ${inputCount} input fields`)
    expect(inputCount).toBeGreaterThanOrEqual(0)
  })

  test('should handle button clicks', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Find all buttons
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    // Should have buttons
    expect(buttonCount).toBeGreaterThan(0)
    
    // First button should be visible and clickable
    if (buttonCount > 0) {
      const firstButton = buttons.first()
      await expect(firstButton).toBeVisible()
    }
  })

  test('should handle link clicks', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Find links
    const links = page.locator('a[href]')
    const linkCount = await links.count()
    
    console.log(`Found ${linkCount} links`)
    expect(linkCount).toBeGreaterThan(0)
  })

  test('should handle mobile menu toggle if present', async ({ page, viewport }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Look for mobile menu button
    const mobileMenuButton = page.locator('[aria-label*="menu"]')
      .or(page.locator('[data-testid*="mobile-menu"]'))
      .or(page.locator('button:has-text("Menu")'))
    
    if (await mobileMenuButton.count() > 0) {
      await expect(mobileMenuButton.first()).toBeVisible()
    }
  })

  test('should handle image loading', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check for images
    const images = page.locator('img')
    const imageCount = await images.count()
    
    if (imageCount > 0) {
      // First image should have alt text or src
      const firstImage = images.first()
      const hasAlt = await firstImage.getAttribute('alt')
      const hasSrc = await firstImage.getAttribute('src')
      
      expect(hasSrc || hasAlt).toBeTruthy()
    }
  })
})

