import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

export default defineConfig({
  site: 'https://llm-tutorial.darvinyi.com',
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
  integrations: [
    mdx({
      remarkPlugins: [remarkGfm, remarkMath],
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, {
          behavior: 'wrap',
          properties: { className: ['heading-anchor'] },
        }],
        [rehypeKatex, {
          strict: false,
          macros: {
            '\\R': '\\mathbb{R}',
            '\\N': '\\mathbb{N}',
            '\\Z': '\\mathbb{Z}',
            '\\E': '\\mathbb{E}',
            '\\Var': '\\operatorname{Var}',
            '\\Cov': '\\operatorname{Cov}',
            '\\softmax': '\\operatorname{softmax}',
            '\\attn': '\\operatorname{Attention}',
            '\\KL': '\\operatorname{KL}',
            '\\argmax': '\\operatorname*{arg\\,max}',
            '\\argmin': '\\operatorname*{arg\\,min}',
          },
        }],
      ],
    }),
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
      exclude: ['pyodide'],
    },
  },
});
