import type { Config } from "tailwindcss";

const config: Config = {
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	safelist: [
		"z-[0]",
		"z-[100]",
		"z-[101]",
		"z-[200]",
		"z-[201]",
		"z-[400]",
		"z-[800]",
		"z-[1600]",
	],
	theme: {
		extend: {
			colors: {
				background: "var(--background)",
				foreground: "var(--foreground)",
				// CAGLLA Brand Colors
				brand: {
					teal: "#1F7E79",
					tealDark: "#165955",
					sand: "#E8DCC2",
					ink: "#2B2B2B",
					blue: "#5FA3D7",
					olive: "#7A8755",
					clay: "#C46A42",
					white: "#FAFAF7", // Mist White
				},
			},
			spacing: {
				section: "4rem",
				card: "2rem",
				cta: "3rem",
			},
			fontFamily: {
				rajdhani: ["var(--font-rajdhani)", "Rajdhani", "sans-serif"],
			},
			screens: {
				"3xl": "1536px",
				"4xl": "1920px",
			},
		},
	},
	plugins: [],
};
export default config;
