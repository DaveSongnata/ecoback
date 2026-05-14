/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      xs: '400px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        primary: {
          clin: '#579D67',
          light: '#268C8C',
          base: '#155B5B',
          dark: '#0A2E2E',
        },
        accent: {
          light: '#F2C4B3',
          base: '#D97D65',
          dark: '#B35A45',
        },
        background: '#F6F5F7',
        shape: '#EDE9F2',
        gray: {
          100: '#ADADAD',
          200: '#949494',
          300: '#666666',
          400: '#3D3D3D',
          500: '#1D1D1D',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Inter Display"', '"Inter"', 'ui-sans-serif', 'system-ui'],
        serif: ['"Instrument Serif"', 'ui-serif', 'Georgia', 'serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.03em',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(10, 46, 46, 0.08)',
        soft: '0 20px 60px -20px rgba(10, 46, 46, 0.18)',
        elevated: '0 30px 80px -30px rgba(10, 46, 46, 0.35)',
      },
    },
  },
  plugins: [],
}
