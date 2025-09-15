import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
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
      },
    },
  },
  plugins: [],
}

export default config

