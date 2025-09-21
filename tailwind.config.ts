import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#FDE5C3',
        accent: '#FFBBBD',
        text: '#2B2B2B',
        muted: '#6B6B6B',
        border: '#E9E2D6',
        success: '#21A67A',
        error: '#D84E4E',
        // Темная тема
        'dark-bg': '#9c6849',
        'dark-text': '#FFFFFF',
        'dark-muted': '#D0D0D0',
        'dark-border': '#7A4F35',
        'dark-card': '#2A2A2A',
      },
    },
  },
  plugins: [],
}

export default config

