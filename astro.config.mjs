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
    sitemap({
      filter: (page) => !page.includes('/draft/') && !page.includes('/_dev/'),
      changefreq: 'monthly',
      lastmod: new Date(),
      priority: 0.7,
      serialize: (item) => {
        if (item.url === 'https://llm-tutorial.darvinyi.com/') {
          item.priority = 1.0;
          item.changefreq = 'weekly';
        }
        return item;
      },
    }),
  ],
  markdown: {
    shikiConfig: {
      /* darvinyi-cyan: custom Shiki theme using design-system tokens
       * (cyan-400/300, emerald-500, amber-500, text-tertiary/secondary).
       * The same hex values are mirrored in the CodeMirror HighlightStyle
       * inside src/components/code/RunnableCode.tsx — keep them in sync
       * so static Shiki blocks and live RunnableCode editors look identical. */
      theme: {
        name: 'darvinyi-cyan',
        type: 'dark',
        colors: {
          'editor.background': '#111111',
          'editor.foreground': '#f5f5f5',
        },
        tokenColors: [
          { scope: ['comment', 'punctuation.definition.comment'],
            settings: { foreground: '#737373', fontStyle: 'italic' } },
          { scope: ['string', 'string.quoted', 'string.template', 'string.regexp', 'punctuation.definition.string'],
            settings: { foreground: '#10b981' } },
          { scope: ['constant.numeric'],
            settings: { foreground: '#f59e0b' } },
          { scope: ['constant.language', 'constant.language.boolean', 'constant.language.python'],
            settings: { foreground: '#f59e0b' } },
          { scope: ['keyword', 'keyword.control', 'keyword.other', 'storage.type', 'storage.modifier'],
            settings: { foreground: '#22d3ee' } },
          { scope: ['keyword.operator'],
            settings: { foreground: '#a3a3a3' } },
          { scope: ['punctuation', 'meta.brace', 'punctuation.separator', 'punctuation.terminator'],
            settings: { foreground: '#a3a3a3' } },
          { scope: ['entity.name.function', 'support.function', 'meta.function-call entity.name.function'],
            settings: { foreground: '#67e8f9' } },
          { scope: ['entity.name.class', 'entity.name.type', 'support.class', 'support.type'],
            settings: { foreground: '#67e8f9' } },
          { scope: ['variable.language', 'variable.language.self', 'variable.language.python'],
            settings: { foreground: '#22d3ee', fontStyle: 'italic' } },
          { scope: ['variable', 'variable.other', 'variable.parameter', 'meta.property-name'],
            settings: { foreground: '#f5f5f5' } },
          { scope: ['meta.decorator', 'entity.name.decorator', 'punctuation.decorator'],
            settings: { foreground: '#22d3ee', fontStyle: 'italic' } },
          /* JSON-specific overrides */
          { scope: ['support.type.property-name.json', 'punctuation.support.type.property-name.json'],
            settings: { foreground: '#67e8f9' } },
        ],
      },
      wrap: false,
    },
  },
  vite: {
    optimizeDeps: {
      exclude: ['pyodide'],
    },
  },
});
