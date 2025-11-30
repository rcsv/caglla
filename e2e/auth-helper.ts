/**
 * Authentication helper for E2E tests
 * Mocks Firebase Authentication state for testing authenticated pages
 */

import { Page } from "@playwright/test";

/**
 * Mock authentication by setting localStorage
 * This simulates a logged-in user
 */
export async function mockAuthenticatedUser(
	page: Page,
	userData?: {
		uid?: string;
		email?: string;
		displayName?: string;
		photoURL?: string;
	},
) {
	const mockUser = {
		uid: userData?.uid || "test-user-123",
		email: userData?.email || "test@example.com",
		displayName: userData?.displayName || "Test User",
		photoURL: userData?.photoURL || "https://example.com/photo.jpg",
		emailVerified: true,
	};

	// Mock Firebase Auth state
	await page.addInitScript((user) => {
		// Mock onAuthStateChanged
		(window as any).__mockFirebaseAuth = {
			currentUser: user,
			onAuthStateChanged: (callback: (user: any) => void) => {
				callback(user);
				return () => {}; // unsubscribe function
			},
		};
	}, mockUser);
}

/**
 * Clear authentication state
 */
export async function clearAuthentication(page: Page) {
	await page.evaluate(() => {
		localStorage.clear();
		sessionStorage.clear();
	});
}

/**
 * Wait for authentication to complete
 */
export async function waitForAuth(page: Page, timeout = 5000) {
	await page.waitForFunction(
		() => {
			return (
				!document.querySelector('[data-testid="loading"]') ||
				document.querySelector('[data-testid="authenticated"]')
			);
		},
		{ timeout },
	);
}
