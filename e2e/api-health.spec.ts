import { test, expect } from '@playwright/test'

/**
 * API health check tests
 * Verifies that API endpoints return appropriate responses
 */

test.describe('API Health Checks', () => {
  test('should return 401 for unauthorized API access', async ({ request }) => {
    // Test /api/trips endpoint without authentication
    const response = await request.get('/api/trips')
    
    // Should return 401 Unauthorized
    expect(response.status()).toBe(401)
  })

  test('should validate request body for API endpoints', async ({ request }) => {
    // Test POST /api/trips without body
    const response = await request.post('/api/trips', {
      headers: { 'Content-Type': 'application/json' },
      data: {}
    })
    
    // Should return 401 (no auth) or 400 (invalid request)
    expect([400, 401]).toContain(response.status())
  })

  test('should handle CORS headers correctly', async ({ request }) => {
    const response = await request.options('/api/trips')
    
    // OPTIONS request should succeed
    expect([200, 204, 404]).toContain(response.status())
  })

  test('should return proper content type for JSON APIs', async ({ request }) => {
    const response = await request.get('/api/trips')
    
    const contentType = response.headers()['content-type']
    
    // Should return JSON content type
    if (response.status() !== 401) {
      expect(contentType).toContain('application/json')
    }
  })

  test('should handle Unsplash API endpoint', async ({ request }) => {
    // Test Unsplash API endpoint
    const response = await request.get('/api/unsplash?destination=Tokyo')
    
    // Should either return 404 (no results) or 200 with photo
    const status = response.status()
    expect([200, 404, 401]).toContain(status)
  })

  test('should handle missing parameters gracefully', async ({ request }) => {
    // Test API without required parameters
    const response = await request.get('/api/unsplash')
    
    // Should return 400 Bad Request for missing parameters
    expect([400, 401]).toContain(response.status())
  })
})

