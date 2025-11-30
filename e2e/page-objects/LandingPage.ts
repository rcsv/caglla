import { Page, Locator } from "@playwright/test";

/**
 * Page Object for Landing Page
 */
export class LandingPage {
	readonly page: Page;
	readonly loginButton: Locator;
	readonly heroSection: Locator;
	readonly featuresSection: Locator;

	constructor(page: Page) {
		this.page = page;
		this.loginButton = page
			.locator(
				'button:has-text("ログイン"), button:has-text("Google"), button[data-testid="login-button"]',
			)
			.first();
		this.heroSection = page.locator("section, div").first();
		this.featuresSection = page.locator("section, div").nth(1);
	}

	async goto() {
		await this.page.goto("/");
		await this.page.waitForLoadState("networkidle");
	}

	async clickLogin() {
		if (await this.loginButton.isVisible()) {
			await this.loginButton.click();
		}
	}

	async isLoggedIn(): Promise<boolean> {
		// Check if user is authenticated by looking for user-related elements
		const userElements = await this.page
			.locator('[data-testid="user-avatar"], [class*="avatar"]')
			.count();
		return userElements > 0;
	}
}
