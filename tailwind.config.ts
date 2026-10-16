import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['var(--font-inter)', 'Inter', 'sans-serif'] },
      colors: {
        canvasBg: '#E9EEF4',
        panelBg: '#F3F5F9',
        cardBg: '#FFFFFF',
        slateDark: '#121826',
        coralRed: '#FF5C4D',
        accentBlue: '#437EF7',
        accentDarkBlue: '#1D2A44',
        softGray: '#F1F4F9',
      },
    },
  },
  plugins: [],
};

export default config;
