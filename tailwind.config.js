/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Marque SideBySide — bleu navy + jaune doré (couleurs du logo)
        sbs: {
          blue: '#1E3A8A',         // siège conducteur, primary
          'blue-dark': '#172554',  // header sombre
          'blue-light': '#DBE3F8', // bg léger
          yellow: '#FCD116',       // siège passager, accent (drapeau CM)
          'yellow-dark': '#E0B70F',
          'yellow-light': '#FFF7CC',
          dark: '#0F172A',         // texte principal
          muted: '#64748B',        // texte secondaire
          cream: '#FAF7F2',        // fond doux
          border: '#E2E8F0',       // bordures
          'border-soft': '#EEF2F7',
          green: '#10B981',        // succès / confirmation
          red: '#EF4444',          // erreur / annulation
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'pill': '9999px',
        'btn': '0.75rem',
        'card': '1rem',
        'card-lg': '1.5rem',
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
        'card': '0 4px 12px rgba(15, 23, 42, 0.08)',
        'card-hover': '0 12px 32px rgba(15, 23, 42, 0.12)',
        'btn-primary': '0 4px 12px rgba(30, 58, 138, 0.25)',
        'btn-accent': '0 4px 12px rgba(252, 209, 22, 0.35)',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
