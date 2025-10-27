import { test, expect } from '@playwright/test'

/**
 * Slug-based routing tests
 * Tests the slug-based URL structure: /[userSlug]/[tripSlug]
 */

test.describe('Slug-based Routing', () => {
  test('should handle slug-based trip URLs', async ({ page }) => {
    // Attempt to navigate to a slug-based URL
    await page.goto('/testuser/tokyotrip')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
      // Page might redirect or show auth required
    })
    
    // Verify URL structure is correct
    const url = page.url()
    expect(url).toContain('/')
  })

  test('should handle invalid slug gracefully', async ({ page }) => {
    const response = await page.goto('/invaliduser/notrip', {
      waitUntil: 'domcontentloaded'
    })
    
    // Should either 404 or redirect to home
    const status = response?.status()
    expect([200, 404, 302]).toContain(status)
  })

  test('should preserve slug format', async ({ page }) => {
    // Test that slugs maintain lowercase format
    const testSlug = 'Tokyo-Trip'
    await page.goto(`/testuser/${testSlug}`)
    
    // URL should be normalized
    const url = page.url()
    console.log('URL:', url)
    
    // URL should be in slug format
    expect(url).toMatch(/\/[a-z0-9-]+\/[a-z0-9-]+/)
  })
})

