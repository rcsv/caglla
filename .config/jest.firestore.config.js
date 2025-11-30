module.exports = {
	rootDir: "..",
	testEnvironment: "node",
	roots: ["<rootDir>"],
	testMatch: [
		"**/*firestore*.test.[jt]s?(x)",
		"**/*backfill-social-stats-integration*.test.[jt]s?(x)",
	],
	testPathIgnorePatterns: ["/node_modules/", "/e2e/", "/.next/"],
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/$1",
	},
	transform: {
		"^.+\\.(ts|tsx)$": [
			"ts-jest",
			{
				tsconfig: {
					jsx: "react",
					esModuleInterop: true,
					allowSyntheticDefaultImports: true,
				},
			},
		],
	},
	setupFiles: ["<rootDir>/jest.polyfills.js"],
	setupFilesAfterEnv: ["<rootDir>/jest.firestore.setup.js"],
	moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
	collectCoverageFrom: [
		"lib/**/*.{js,jsx,ts,tsx}",
		"scripts/**/*.{js,jsx,ts,tsx}",
		"!lib/**/*.d.ts",
		"!**/node_modules/**",
	],
};
