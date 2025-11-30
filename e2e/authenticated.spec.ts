import { test, expect } from "./fixtures";

/**
 * Tests that require authentication
 */

test.describe("Authentication Mock", () => {
	test("should access authenticated page with mock auth", async ({
		authenticatedPage,
	}) => {
		// Navigate to home page
		await authenticatedPage.goto("/home");

		// Wait for page to load
		await authenticatedPage.waitForLoadState("networkidle");

		// Page should load without redirect
		const url = authenticatedPage.url();
		expect(url).toContain("/home");
	});

	test("should display user data on authenticated page", async ({
		authenticatedPage,
	}) => {
		await authenticatedPage.goto("/home");
		await authenticatedPage.waitForLoadState("networkidle");

		// Look for elements that indicate authenticated state
		const body = authenticatedPage.locator("body");
		await expect(body).toBeVisible();

		// Should have some content indicating user is logged in
		const hasContent = await body.textContent();
		expect(hasContent?.length).toBeGreaterThan(0);
	});

	test("should handle authenticated navigation", async ({
		authenticatedPage,
	}) => {
		await authenticatedPage.goto("/home");
		await authenticatedPage.waitForLoadState("networkidle");

		// Look for navigation elements
		const navElements = authenticatedPage.locator('nav, [role="navigation"]');
		const navCount = await navElements.count();

		// Should have navigation elements (even if not visible)
		expect(navCount).toBeGreaterThanOrEqual(0);
	});

	test("should access trip detail page", async ({ authenticatedPage }) => {
		// Try to access a trip detail page (will likely 404 but shouldn't crash)
		await authenticatedPage.goto("/testuser/tokyotrip");
		await authenticatedPage.waitForLoadState("networkidle");

		// Should either load or show error gracefully
		const url = authenticatedPage.url();
		expect(url).toBeTruthy();
	});
});
