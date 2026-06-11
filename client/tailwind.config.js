/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base': 'var(--bg-base)',
        'bg-deeper': 'var(--bg-deeper)',
        'surface-1': 'var(--surface-1)',
        'surface-2': 'var(--surface-2)',
        'surface-3': 'var(--surface-3)',
        impostor: 'var(--impostor)',
        citizen: 'var(--citizen)',
        gold: 'var(--gold)',
        'gold-soft': 'var(--gold-soft)',
        victory: 'var(--victory)',
        paper: 'var(--paper)',
        'paper-2': 'var(--paper-2)',
        'paper-3': 'var(--paper-3)',
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        'ink-3': 'var(--ink-3)',
        thread: 'var(--thread)',
        'text-1': 'var(--text-1)',
        'text-2': 'var(--text-2)',
        'text-3': 'var(--text-3)',
        'text-faint': 'var(--text-faint)',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        ui: ['"Familjen Grotesk"', 'system-ui', 'sans-serif'],
        type: ['"Special Elite"', '"Courier New"', 'monospace'],
        num: ['Fraunces', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
