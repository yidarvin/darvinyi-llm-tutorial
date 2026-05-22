/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          elevated: 'var(--bg-elevated)',
          overlay: 'var(--bg-overlay)',
          inline: 'var(--bg-inline)',
        },
        fg: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          disabled: 'var(--text-disabled)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          DEFAULT: 'var(--border-default)',
          strong: 'var(--border-strong)',
        },
        cyan: {
          300: 'var(--cyan-300)',
          400: 'var(--cyan-400)',
          500: 'var(--cyan-500)',
          600: 'var(--cyan-600)',
        },
        amber:   { 500: 'var(--amber-500)' },
        rose:    { 500: 'var(--rose-500)' },
        emerald: { 500: 'var(--emerald-500)' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'SF Mono', 'Menlo', 'monospace'],
      },
      maxWidth: {
        prose: 'var(--container-prose)',
        wide:  'var(--container-wide)',
      },
    },
  },
  plugins: [],
};
