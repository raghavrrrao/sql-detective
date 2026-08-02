/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Oswald', 'Impact', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Major game headings: case titles, difficulty, verdicts, ranks.
        heading: ['"Rubik Dirt"', 'Impact', 'ui-sans-serif', 'sans-serif'],
        // Scores, timers, standings.
        numeric: ['Oxanium', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        // The wordmark only.
        logo: ['"IM Fell English SC"', 'Georgia', 'ui-serif', 'serif'],
        // Anything that is meant to read as a document out of the case file.
        document: ['"Special Elite"', '"Courier New"', 'ui-monospace', 'monospace'],
        sans: ['Rajdhani', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      /*
       * The room, not the void.
       *
       * The old palette sat on near-black (#08070A), which reads as an unlit
       * dashboard rather than a room with a lamp in it. Everything is lifted
       * onto charcoal and warmed towards leather, brass and aged paper. Every
       * text/surface pair in this palette was measured against WCAG AA before
       * it was adopted; the tightest is crimson-glow on a panel at 4.95:1.
       */
      colors: {
        // Page and overlay base. `ink` is also the text colour on gold.
        ink: { DEFAULT: '#1B1B21', soft: '#212129', deep: '#141419' },
        // Panel surfaces, in ascending elevation.
        charcoal: { DEFAULT: '#26262F', light: '#31313A', raised: '#3A3A45', line: '#4A4A56' },
        // Mahogany rather than fire-engine.
        crimson: { DEFAULT: '#A91D2B', bright: '#C9273A', deep: '#6E1119', glow: '#EC6076' },
        // Brass rather than yellow.
        gold: { DEFAULT: '#B89242', bright: '#D9B45F', deep: '#6E5722' },
        // Aged paper, warm through the whole ramp.
        bone: { DEFAULT: '#F3F0E8', muted: '#CFC9BC', dim: '#A39D90' },
        verdict: { clear: '#5FA877', watch: '#D6A33A', alert: '#E36A7C', info: '#7FA9D4' },
        // Desk leather, used by the board backdrop.
        leather: { DEFAULT: '#2B2119', deep: '#1E1712' },
      },
      /*
       * clip-path clips an element's *outer* box-shadow away entirely, and
       * almost every panel in this game is clipped. So elevation is carried by
       * inset light along the top edge and inset shade along the bottom — the
       * way a real object catches a desk lamp — with outer shadows kept for
       * the unclipped things that can actually show them.
       */
      boxShadow: {
        panel: 'inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -22px 34px -26px rgba(0,0,0,0.9), 0 18px 44px -24px rgba(0,0,0,0.75)',
        'panel-raised': 'inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -24px 38px -28px rgba(0,0,0,0.85), 0 22px 52px -26px rgba(0,0,0,0.8)',
        lift: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 14px 30px -14px rgba(0,0,0,0.75)',
        press: 'inset 0 2px 6px rgba(0,0,0,0.45)',
        glow: '0 0 0 1px rgba(184,146,66,0.32), 0 14px 40px -14px rgba(184,146,66,0.32)',
        crimson: '0 0 0 1px rgba(169,29,43,0.45), 0 16px 44px -16px rgba(169,29,43,0.55)',
        // The lamp cone that separates the board from the room behind it.
        lamp: '0 -30px 70px -40px rgba(217,180,95,0.30)',
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
        // A card settling onto the desk rather than sliding in from nowhere.
        settle: {
          '0%': { opacity: '0', transform: 'translate3d(0,10px,0) scale(0.995)' },
          '100%': { opacity: '1', transform: 'translate3d(0,0,0) scale(1)' },
        },
        // The lamp warming up behind the board.
        breathe: {
          '0%,100%': { opacity: '0.55' },
          '50%': { opacity: '0.8' },
        },
      },
      animation: {
        drift: 'drift 24s ease-in-out infinite',
        float: 'float 14s linear infinite',
        scan: 'scan 2.6s linear infinite',
        sweep: 'sweep 1.6s ease-in-out infinite',
        flicker: 'flicker 6s ease-in-out infinite',
        settle: 'settle 380ms cubic-bezier(0.22,1,0.36,1) both',
        breathe: 'breathe 9s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
