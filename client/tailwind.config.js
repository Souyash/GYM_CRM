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
        sans: ['"Plus Jakarta Sans"', 'Poppins', 'Inter', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'Poppins', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        poppins: ['Poppins', 'sans-serif'],
      },
      colors: {
        // High-Precision Brand & Status Design System Tokens
        carbon: {
          950: '#06080D',          // Pure Void Black (App canvas)
          900: '#0B0F17',          // Base Dark Canvas
          850: '#111622',          // Elevated Card Surface
          800: '#171E2E',          // Interactive Elements & Containers
          750: '#1F283C',          // Secondary Surface
          700: '#28344C',          // Subtle Structural Border
          600: '#3D4C6A',          // Muted Dividers
          500: '#64748B',          // Secondary Text
          400: '#94A3B8',          // Light Secondary
          200: '#E2E8F0',          // Readable Body
          50:  '#F8FAFC'           // Crisp Pure Heading
        },
        volt: {
          50:  '#ECFDF5',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',          // Signature Turnstile Access & Active Pass
          600: '#059669',
          glow: 'rgba(16, 185, 129, 0.35)'
        },
        signal: {
          crimson: '#EF4444',      // Security Hold / Multi-Device Clone
          amber:   '#F59E0B',      // Cross-Gym Mismatch / Expiring Soon
          cobalt:  '#3B82F6',      // Desk Billing & Subscriptions
          cyan:    '#06B6D4',      // Anti-Passback Cooldown Timer
        },
        gym: {
          green: '#10B981',        // Signature Emerald Green
          greenHover: '#059669',   // Deep Forest Green
          greenLight: '#D1FAE5',   // Soft Mint Highlight
          greenNeon: '#00E676',    // Athletic Neon Green for Dark Mode
          danger: '#EF4444',       // Crisp Alert Coral
          amber: '#F59E0B'         // Notice Amber
        },
        dark: {
          950: '#06080D',          // Pitch Void Black
          900: '#0B0F17',          // Charcoal Black Canvas
          850: '#111622',          // Surface Card
          800: '#171E2E',          // Elevated Card
          750: '#1F283C',
          700: '#28344C',          // Border
          600: '#3D4C6A',
          500: '#71717A'
        }
      },
      boxShadow: {
        'volt-glow': '0 0 25px rgba(16, 185, 129, 0.35)',
        'crimson-glow': '0 0 25px rgba(239, 68, 68, 0.35)',
        'amber-glow': '0 0 25px rgba(245, 158, 11, 0.35)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.35)',
        'glow-neon': '0 0 25px rgba(0, 230, 118, 0.4)',
        'card-light': '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
        'card-dark': '0 10px 30px -5px rgba(0, 0, 0, 0.7)'
      }
    },
  },
  plugins: [],
}
