import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://llm-tutorial.darvinyi.com',
  integrations: [
    mdx(),
    react(),
    tailwind({ applyBaseStyles: false }),
    sitemap(),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: false,
    },
  },
  vite: {
    optimizeDeps: {
      // Pyodide is dynamic-imported from a CDN — never pre-bundle it.
      // This entry is forward-looking; safe to include before Pyodide is in use.
      exclude: ['pyodide'],
    },
  },
});
