/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        btc:     '#F7931A',   // Bitcoin orange — primary
        black:   '#0A0A0A',   // deep black — bg
        acid:    '#cafd00',   // electric green — verified / accent
        amber:   '#F59E0B',   // amber — dispute / warning
        surface: '#111111',   // card background
        border:  '#1f1f1f',   // subtle borders
        muted:   '#999999',   // muted text
        dim:     '#333333',   // dimmed elements
      },
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-btc':  'pulse-btc 2s ease-in-out infinite',
        'score-fill': 'score-fill 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'fade-up':    'fade-up 0.4s ease-out forwards',
        'shimmer':    'shimmer 1.5s infinite',
      },
      keyframes: {
        'pulse-btc': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(247, 147, 26, 0.4)' },
          '50%':      { boxShadow: '0 0 0 12px rgba(247, 147, 26, 0)' },
        },
        'score-fill': {
          from: { strokeDashoffset: '339.3' },
          to:   { strokeDashoffset: 'var(--target-offset)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

