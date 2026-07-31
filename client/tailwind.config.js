/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Oswald', 'Impact', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        ink: { DEFAULT: '#08070A', soft: '#0C0C10' },
        charcoal: { DEFAULT: '#131318', light: '#1B1B21', line: '#26262E' },
        crimson: { DEFAULT: '#C4132E', bright: '#E5233F', deep: '#7A0A1C', glow: '#FF3B57' },
        gold: { DEFAULT: '#C9A227', bright: '#E8C766', deep: '#7A6215' },
        bone: { DEFAULT: '#F3F2EE', muted: '#B9B8C2', dim: '#8B8A96' },
        verdict: { clear: '#3FBF7F', watch: '#E0A22B', alert: '#E5384F' },
      },
      boxShadow: {
        panel: '0 24px 60px -20px rgba(0,0,0,0.85)',
        glow: '0 0 0 1px rgba(201,162,39,0.28), 0 12px 40px -12px rgba(201,162,39,0.30)',
        crimson: '0 0 0 1px rgba(196,19,46,0.35), 0 16px 44px -16px rgba(196,19,46,0.55)',
      },
      keyframes: {
        drift: {
          '0%,100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(2rem,-1.5rem,0)' },
        },
        float: {
          '0%': { transform: 'translate3d(0,0,0)', opacity: '0' },
          '12%,80%': { opacity: '0.7' },
          '100%': { transform: 'translate3d(1.5rem,-7rem,0)', opacity: '0' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
        sweep: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(220%)' },
        },
        flicker: {
          '0%,100%': { opacity: '1' },
          '48%': { opacity: '1' },
          '50%': { opacity: '0.55' },
          '52%': { opacity: '1' },
        },
      },
      animation: {
        drift: 'drift 24s ease-in-out infinite',
        float: 'float 14s linear infinite',
        scan: 'scan 2.6s linear infinite',
        sweep: 'sweep 1.6s ease-in-out infinite',
        flicker: 'flicker 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
