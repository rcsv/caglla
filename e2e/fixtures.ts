import { test as base, chromium } from '@playwright/test'

/**
 * Custom test fixtures with authentication mock
 */

// Define the fixtures type
type TestFixtures = {
  authenticatedPage: any
}

// Extend base test with custom fixtures
export const test = base.extend<TestFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    // Create a new context with authentication state
    const context = await browser.newContext({
      storageState: {
        cookies: [],
        origins: [
          {
            origin: 'http://localhost:3000',
            localStorage: [
              {
                name: 'firebase:authUser:test-project:[DEFAULT]',
                value: JSON.stringify({
                  uid: 'test-user-123',
                  email: 'test@example.com',
                  displayName: 'Test User',
                  photoURL: 'https://example.com/photo.jpg',
                  emailVerified: true,
                  stsTokenManager: {
                    accessToken: 'mock-access-token',
                    refreshToken: 'mock-refresh-token',
                    expirationTime: Date.now() + 3600000
                  }
                })
              }
            ]
          }
        ]
      }
    })

    const page = await context.newPage()

    // Mock Firebase Auth methods
    await page.addInitScript(() => {
      // Override onAuthStateChanged to immediately return authenticated user
      (window as any).__mockFirebaseAuth = true
      
      // Mock the auth module
      Object.defineProperty(window, 'firebase', {
        value: {
          auth: () => ({
            currentUser: {
              uid: 'test-user-123',
              email: 'test@example.com',
              displayName: 'Test User',
              photoURL: 'https://example.com/photo.jpg'
            },
            onAuthStateChanged: (callback: (user: any) => void) => {
              callback({
                uid: 'test-user-123',
                email: 'test@example.com',
                displayName: 'Test User',
                photoURL: 'https://example.com/photo.jpg'
              })
              return () => {} // unsubscribe function
            },
            signOut: async () => {}
          })
        },
        writable: true
      })
    })

    await use(page)

    await context.close()
  }
})

export { expect } from '@playwright/test'

