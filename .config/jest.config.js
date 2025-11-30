const nextJest = require("next/jest");

const createJestConfig = nextJest({
	dir: "./",
});

const customJestConfig = {
	rootDir: "..",
	setupFiles: ["<rootDir>/jest.polyfills.js"],
	setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
	testEnvironment: "jest-environment-jsdom",
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/$1",
	},
	testMatch: [
		"**/__tests__/**/*.test.[jt]s?(x)",
		"**/?(*.)+(spec|test).[jt]s?(x)",
	],
	testPathIgnorePatterns: [
		"/node_modules/",
		"/e2e/",
		"<rootDir>/.*firestore.*\\.test\\.[jt]sx?$",
		"<rootDir>/.*backfill-social-stats-integration.*\\.test\\.[jt]sx?$",
	],
	collectCoverageFrom: [
		"components/**/*.{js,jsx,ts,tsx}",
		"hooks/**/*.{js,jsx,ts,tsx}",
		"lib/**/*.{js,jsx,ts,tsx}",
		"!lib/**/*.d.ts",
		"!lib/core/types.ts",
		"!**/*.stories.{js,jsx,ts,tsx}",
		"!**/node_modules/**",
	],
	coverageDirectory: "coverage",
	coverageReporters: ["text", "lcov", "html"],
};

module.exports = createJestConfig(customJestConfig);
