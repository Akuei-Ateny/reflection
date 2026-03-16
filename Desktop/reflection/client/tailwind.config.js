/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Princeton: black, orange, white — twisted for light & dark
        primary: '#E77500',      // Princeton orange
        'primary-light': '#F58025',
        'primary-dark': '#C26100',
        secondary: '#1a1a1a',    // near-black
        accent: '#E77500',
        background: '#FAFAF9',
        surface: '#FFFFFF',
        text: '#0d0d0d',
        'text-muted': '#525252',
        // Dark mode (class .dark)
        'dark-bg': '#0d0d0d',
        'dark-surface': '#1a1a1a',
        'dark-border': '#2a2a2a'
      },
      borderRadius: {
        card: '22px',
        button: '12px'
      },
      boxShadow: {
        card: '0 4px 20px rgba(0,0,0,0.06)',
        'card-hover': '0 12px 40px rgba(231, 117, 0, 0.15)',
        'dark-card': '0 4px 20px rgba(0,0,0,0.3)',
        'dark-card-hover': '0 12px 40px rgba(231, 117, 0, 0.12)'
      }
    }
  },
  plugins: []
};
