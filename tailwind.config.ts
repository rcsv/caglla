import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'z-[0]',
    'z-[100]',
    'z-[101]',
    'z-[200]',
    'z-[201]',
    'z-[400]',
    'z-[800]',
    'z-[1600]',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      fontFamily: {
        rajdhani: ['var(--font-rajdhani)', 'Rajdhani', 'sans-serif'],
      },
      screens: {
        '3xl': '1536px',
        '4xl': '1920px',
      },
    },
  },
  plugins: [],
}
export default config
