/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand
        primary:   '#1877F2', // Facebook blue
        primaryHv: '#1665d8',
        primaryLt: '#e7f0fd',
        // Light theme
        surface:   '#ffffff',
        surfaceAlt:'#f8f9fa',
        border:    '#e4e6eb',
        borderDk:  '#c8d0dc',
        text:      '#1a1a2e',
        textSub:   '#65676b',
        textMuted: '#9ca3af',
        // Accents
        gold:      '#c9a84c',
        lake:      '#344a57',
        success:   '#22c55e',
        danger:    '#ef4444',
        warning:   '#f59e0b',
      },
      screens: { 'xs': '375px' },
      boxShadow: {
        'card':  '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'cardHv':'0 4px 12px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06)',
        'nav':   '0 2px 8px rgba(0,0,0,0.08)',
      }
    },
  },
  plugins: [],
}
