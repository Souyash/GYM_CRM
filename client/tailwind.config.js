/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      colors: {
        gym: {
          green: '#10B981',        // Signature Emerald Green
          greenHover: '#059669',   // Deep Forest Green
          greenLight: '#D1FAE5',   // Soft Mint Highlight
          greenNeon: '#00E676',    // Athletic Neon Green for Dark Mode
          danger: '#EF4444',       // Crisp Alert Coral
          amber: '#F59E0B'         // Notice Amber
        },
        dark: {
          950: '#000000',          // Pitch Pure Black
          900: '#09090B',          // Charcoal Black
          850: '#121215',          // Surface Black
          800: '#18181B',          // Elevated Card
          750: '#222226',
          700: '#27272A',          // Border
          600: '#3F3F46',
          500: '#71717A'
        }
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.35)',
        'glow-neon': '0 0 25px rgba(0, 230, 118, 0.4)',
        'card-light': '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
        'card-dark': '0 10px 30px -5px rgba(0, 0, 0, 0.7)'
      }
    },
  },
  plugins: [],
}
