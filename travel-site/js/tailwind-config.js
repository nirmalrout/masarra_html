// Loaded right after the Tailwind CDN script on every page. Maps utilities to CSS design tokens.
tailwind.config = {
  theme: { extend: {
    fontFamily: { sans: ['Poppins', 'sans-serif'] },
    colors: { brand: { DEFAULT: 'var(--color-primary)', dark: 'var(--color-primary-dark)' }, blush: 'var(--color-secondary)', coral: 'var(--color-accent)', surface: 'var(--bg-alt)' }
  } }
};
