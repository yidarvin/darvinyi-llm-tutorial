# Session 137 — Social meta and OG cards — **POLISH PHASE 6 OF 6 — THE FINAL BUILD SESSION**

> **The final polish session. The final session of the entire 177-file build.** Performance pass (136) made the curriculum fast; **social meta and OG cards make it shareable and findable.** Per-chapter Open Graph cards auto-generated at build time via Satori + resvg, comprehensive social meta tags (OG + Twitter Card + canonical + alternates), JSON-LD structured data marking each chapter as a `LearningResource` and the curriculum as a `Course`, Astro sitemap integration, robots.txt. **A link to any chapter, shared anywhere on the web, renders a custom card with the chapter's identity.** **A search-engine crawler discovers all 30 chapters via the sitemap and indexes them with rich structured data.** **The final session of the build.** When this ships: cross-chapter linking + search + mobile + accessibility + performance + discoverability — every polish concern addressed. **The 30-chapter curriculum is shipped, fully.**

---

## Read first (in this order)

1. **`prompts/polish/session-136-performance-pass.md`** — for the build-pipeline conventions (subset-fonts, build-search-index — this session adds build-og-cards alongside them)
2. **Open Graph Protocol** — [ogp.me](https://ogp.me) — for the canonical meta-tag reference
3. **Schema.org Course** — [schema.org/Course](https://schema.org/Course) — for the JSON-LD structured-data spec
4. **Satori documentation** — [github.com/vercel/satori](https://github.com/vercel/satori) — for the OG-card rendering library

---

## Goal

By end of session, five concrete artifacts ship:

1. **Per-chapter OG card PNGs** at `public/og/{slug}.png` — auto-generated at build time. Each is a 1200×630 PNG with the chapter number, title, part name, and visual style matching the site. **30 PNGs total, one per chapter.**
2. **A comprehensive `<SEO>` Astro component** at `src/components/seo/SEO.astro` — renders the full meta-tag stack from chapter metadata: title, description, canonical, OG (image, title, description, type, url, locale, site_name), Twitter Card (card, title, description, image, creator), author, robots.
3. **A `<JsonLd>` component** at `src/components/seo/JsonLd.astro` — renders schema.org structured data: site-level `Course` + per-chapter `LearningResource` + breadcrumbs.
4. **Sitemap integration** via `@astrojs/sitemap` plugin — emits `public/sitemap-index.xml` and `public/sitemap-0.xml` at build covering all 30 chapter pages + the home page.
5. **`public/robots.txt`** — points to sitemap; allows all crawlers; sets crawl-delay.

**End state:** every chapter URL shared on any social platform, messaging app, or chat shows a custom card with the chapter's identity. Search engines discover the whole curriculum via the sitemap and index each chapter as a structured learning resource. **The 30-chapter curriculum is shipped, fully.**

---

## Inputs

State of the repo after session 136:

- All 30 chapters published
- Cross-chapter linking, search, mobile pass, accessibility audit, performance pass shipped
- Build pipeline runs `subset-fonts` and `build-search-index` as prebuild steps
- Lighthouse CI in place
- No OG cards yet, no comprehensive SEO meta yet, no sitemap

---

## Deliverables

1. **Install** dependencies: `npm install satori @resvg/resvg-js satori-html` plus `@astrojs/sitemap` for the sitemap integration
2. **Create** `scripts/build-og-cards.mjs` — the OG-card generator (Node.js, build-time)
3. **Create** `src/og-template.tsx` (or `.jsx`) — the JSX template for OG-card rendering (used by Satori)
4. **Update** `package.json` — add `build:og-cards` script; chain into `prebuild`
5. **Create** `src/components/seo/SEO.astro` — comprehensive meta-tag component
6. **Create** `src/components/seo/JsonLd.astro` — structured-data component
7. **Update** `astro.config.mjs` — add `@astrojs/sitemap` integration; set site URL
8. **Update** `src/layouts/ChapterLayout.astro` — render `<SEO>` and `<JsonLd>` in `<head>`
9. **Update** `src/layouts/HomeLayout.astro` — same for home page
10. **Create** `public/robots.txt` — robot configuration

---

## Detailed spec

### 1. OG card template (`src/og-template.tsx`)

The JSX template Satori renders into SVG. Visually matches the curriculum: dark background, cyan accent, three font families.

```tsx
// src/og-template.tsx

interface OgTemplateProps {
  chapterNum: number;
  chapterTitle: string;
  partName: string;
  partNum: number;
}

export function OgTemplate({ chapterNum, chapterTitle, partName, partNum }: OgTemplateProps) {
  return (
    <div
      style={{
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #0a0e1a 0%, #0d1421 100%)',
        padding: '80px 90px',
        fontFamily: 'Inter',
        color: '#e8eaed',
      }}
    >
      {/* Top: curriculum branding */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{
          fontFamily: 'JetBrains Mono',
          fontSize: 18,
          color: '#7dd3fc',
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
          fontWeight: 500,
        }}>
          LLM Tutorial
        </div>
        <div style={{
          fontFamily: 'JetBrains Mono',
          fontSize: 14,
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
        }}>
          Part {romanNumeral(partNum)} · {partName}
        </div>
      </div>

      {/* Middle: chapter number + title */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{
          fontFamily: 'JetBrains Mono',
          fontSize: 28,
          color: '#06b6d4',
          fontWeight: 500,
          letterSpacing: '0.06em',
        }}>
          Chapter {chapterNum}
        </div>
        <div style={{
          fontFamily: 'Crimson Pro',
          fontSize: 80,
          color: '#ffffff',
          fontWeight: 500,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
        }}>
          {chapterTitle}
        </div>
      </div>

      {/* Bottom: accent + author */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid #1e2a3a',
        paddingTop: 28,
      }}>
        <div style={{
          fontFamily: 'Inter',
          fontSize: 22,
          color: '#94a3b8',
        }}>
          Darvin Yi · llm-tutorial.darvinyi.com
        </div>
        <div style={{
          width: 64,
          height: 64,
          background: 'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'JetBrains Mono',
          fontSize: 32,
          fontWeight: 600,
          color: '#0a0e1a',
        }}>
          {chapterNum}
        </div>
      </div>
    </div>
  );
}

function romanNumeral(n: number): string {
  const map: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX' };
  return map[n] ?? String(n);
}
```

### 2. OG-card build script (`scripts/build-og-cards.mjs`)

```js
// scripts/build-og-cards.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { html as toReactNode } from 'satori-html';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUTPUT_DIR = join(ROOT, 'public/og');

// Load chapter manifest from chapters.ts (same regex approach as build-search-index)
function loadChapters() {
  const src = readFileSync(join(ROOT, 'src/lib/chapters.ts'), 'utf8');
  const chapters = [];
  const regex = /\{\s*num:\s*(\d+)\s*,\s*slug:\s*'([^']+)'\s*,\s*title:\s*'([^']+)'\s*,\s*partNum:\s*(\d+)/g;
  let m;
  while ((m = regex.exec(src)) !== null) {
    chapters.push({
      num: parseInt(m[1], 10),
      slug: m[2],
      title: m[3],
      partNum: parseInt(m[4], 10),
    });
  }
  return chapters;
}

const PART_NAMES = {
  1: 'Foundations',
  2: 'The Transformer',
  3: 'Pre-training',
  4: 'Alternate Architectures',
  5: 'Post-training',
  6: 'Inference',
  7: 'Capabilities',
  8: 'Discipline',
  9: 'Agents',
};

function romanNumeral(n) {
  return ({ 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX' })[n] ?? String(n);
}

// Load fonts (use the subsetted versions from session 136)
function loadFont(name, weight, style = 'normal') {
  const filename = `${name.replace(/\s/g, '')}-${weightToLabel(weight)}.woff2`;
  return {
    name,
    data: readFileSync(join(ROOT, 'public/fonts', filename)),
    weight,
    style,
  };
}
function weightToLabel(w) {
  return ({ 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold' })[w] ?? 'Regular';
}

// JSX-free template (satori-html parses HTML strings to React VDOM)
function template({ chapterNum, chapterTitle, partName, partNum }) {
  return toReactNode(`
    <div style="
      width: 1200px;
      height: 630px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: linear-gradient(135deg, #0a0e1a 0%, #0d1421 100%);
      padding: 80px 90px;
      font-family: 'Inter';
      color: #e8eaed;
    ">
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div style="font-family: 'JetBrains Mono'; font-size: 18px; color: #7dd3fc; text-transform: uppercase; letter-spacing: 0.16em; font-weight: 500;">
          LLM Tutorial
        </div>
        <div style="font-family: 'JetBrains Mono'; font-size: 14px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.12em;">
          Part ${romanNumeral(partNum)} · ${partName}
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 18px;">
        <div style="font-family: 'JetBrains Mono'; font-size: 28px; color: #06b6d4; font-weight: 500; letter-spacing: 0.06em;">
          Chapter ${chapterNum}
        </div>
        <div style="font-family: 'Crimson Pro'; font-size: 80px; color: #ffffff; font-weight: 500; line-height: 1.05; letter-spacing: -0.02em;">
          ${escapeHtml(chapterTitle)}
        </div>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #1e2a3a; padding-top: 28px;">
        <div style="font-family: 'Inter'; font-size: 22px; color: #94a3b8;">
          Darvin Yi · llm-tutorial.darvinyi.com
        </div>
        <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #06b6d4 0%, #0e7490 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono'; font-size: 32px; font-weight: 600; color: #0a0e1a;">
          ${chapterNum}
        </div>
      </div>
    </div>
  `);
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function buildOgCard(chapter) {
  const partName = PART_NAMES[chapter.partNum] ?? '';
  const node = template({
    chapterNum: chapter.num,
    chapterTitle: chapter.title,
    partName,
    partNum: chapter.partNum,
  });

  const svg = await satori(node, {
    width: 1200,
    height: 630,
    fonts: [
      loadFont('JetBrains Mono', 400),
      loadFont('JetBrains Mono', 500),
      loadFont('Inter', 400),
      loadFont('Inter', 500),
      loadFont('Crimson Pro', 500),
    ],
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    background: '#0a0e1a',
  });
  const png = resvg.render().asPng();

  const outputPath = join(OUTPUT_DIR, `${chapter.slug}.png`);
  writeFileSync(outputPath, png);
  console.log(`✓ ${chapter.slug}.png (${(png.length / 1024).toFixed(1)} KB)`);
}

async function buildHomeOgCard() {
  const node = toReactNode(`
    <div style="
      width: 1200px; height: 630px;
      display: flex; flex-direction: column; justify-content: space-between;
      background: linear-gradient(135deg, #0a0e1a 0%, #0d1421 100%);
      padding: 80px 90px;
      font-family: 'Inter'; color: #e8eaed;
    ">
      <div style="font-family: 'JetBrains Mono'; font-size: 22px; color: #7dd3fc; text-transform: uppercase; letter-spacing: 0.16em; font-weight: 500;">
        Darvin Yi
      </div>
      <div style="display: flex; flex-direction: column; gap: 24px;">
        <div style="font-family: 'Crimson Pro'; font-size: 100px; color: #ffffff; font-weight: 500; line-height: 1.0; letter-spacing: -0.02em;">
          LLM Tutorial
        </div>
        <div style="font-family: 'Inter'; font-size: 36px; color: #cbd5e1; line-height: 1.3; font-weight: 400;">
          30 chapters · numpy primitives to agent systems
        </div>
      </div>
      <div style="font-family: 'Inter'; font-size: 22px; color: #94a3b8;">
        llm-tutorial.darvinyi.com
      </div>
    </div>
  `);
  const svg = await satori(node, { width: 1200, height: 630, fonts: [
    loadFont('JetBrains Mono', 500),
    loadFont('Inter', 400),
    loadFont('Inter', 500),
    loadFont('Crimson Pro', 500),
  ]});
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  writeFileSync(join(OUTPUT_DIR, 'home.png'), png);
  console.log(`✓ home.png (${(png.length / 1024).toFixed(1)} KB)`);
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const chapters = loadChapters();
  console.log(`Building OG cards for ${chapters.length} chapters + home...`);
  for (const ch of chapters) {
    await buildOgCard(ch);
  }
  await buildHomeOgCard();
  console.log(`✓ Built ${chapters.length + 1} OG cards`);
}

main().catch(err => {
  console.error('Failed to build OG cards:', err);
  process.exit(1);
});
```

### 3. `package.json` updates

```json
{
  "scripts": {
    "build:og-cards": "node scripts/build-og-cards.mjs",
    "prebuild": "npm run subset:fonts && npm run build:search-index && npm run build:og-cards"
  },
  "dependencies": {
    "satori": "^0.10.0",
    "satori-html": "^0.3.0",
    "@resvg/resvg-js": "^2.6.0",
    "@astrojs/sitemap": "^3.0.0"
  }
}
```

### 4. `<SEO>` component (`src/components/seo/SEO.astro`)

```astro
---
interface Props {
  /** Page title (before site suffix). */
  title: string;
  /** Page description for meta + OG. */
  description: string;
  /** Page slug (used for canonical and OG image). 'home' for the home page. */
  slug?: string;
  /** Override the OG image (defaults to /og/{slug}.png). */
  ogImage?: string;
  /** Page type: 'website' (home) | 'article' (chapter). */
  type?: 'website' | 'article';
  /** ISO date for article published_time. */
  publishedTime?: string;
  /** Twitter handle (without @). */
  twitterCreator?: string;
}

const {
  title,
  description,
  slug = '',
  ogImage,
  type = 'website',
  publishedTime,
  twitterCreator = 'darvinistrying',
} = Astro.props;

const SITE_URL = 'https://llm-tutorial.darvinyi.com';
const SITE_NAME = 'LLM Tutorial';

const fullUrl = slug ? `${SITE_URL}/${slug}/` : `${SITE_URL}/`;
const fullOgImage = ogImage ?? `${SITE_URL}/og/${slug || 'home'}.png`;
const fullTitle = `${title} · ${SITE_NAME}`;
---

<!-- Basic meta -->
<title>{fullTitle}</title>
<meta name="description" content={description} />
<link rel="canonical" href={fullUrl} />

<!-- Open Graph -->
<meta property="og:type" content={type} />
<meta property="og:site_name" content={SITE_NAME} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:url" content={fullUrl} />
<meta property="og:locale" content="en_US" />
<meta property="og:image" content={fullOgImage} />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content={`${title} — ${SITE_NAME}`} />

{publishedTime && type === 'article' && (
  <meta property="article:published_time" content={publishedTime} />
)}

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={fullOgImage} />
<meta name="twitter:image:alt" content={`${title} — ${SITE_NAME}`} />
{twitterCreator && (
  <meta name="twitter:creator" content={`@${twitterCreator}`} />
)}

<!-- Author / robots -->
<meta name="author" content="Darvin Yi" />
<meta name="robots" content="index,follow,max-image-preview:large" />

<!-- Theme color -->
<meta name="theme-color" content="#0a0e1a" />
```

### 5. `<JsonLd>` component (`src/components/seo/JsonLd.astro`)

```astro
---
interface Props {
  /** 'home' for the curriculum overview; 'chapter' for an individual chapter. */
  kind: 'home' | 'chapter';
  /** Chapter slug (for kind=chapter). */
  slug?: string;
  /** Chapter title (for kind=chapter). */
  title?: string;
  /** Chapter description (for kind=chapter). */
  description?: string;
  /** Chapter number (for kind=chapter). */
  chapterNum?: number;
  /** Part name (for kind=chapter). */
  partName?: string;
}

const { kind, slug, title, description, chapterNum, partName } = Astro.props;
const SITE_URL = 'https://llm-tutorial.darvinyi.com';

let jsonLd: any;

if (kind === 'home') {
  jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: 'LLM Tutorial',
    description: '30 chapters from numpy primitives to agent systems in production. A comprehensive engineering-focused curriculum on large language models.',
    url: `${SITE_URL}/`,
    provider: {
      '@type': 'Person',
      name: 'Darvin Yi',
      url: 'https://darvinyi.com',
    },
    educationalLevel: 'Advanced',
    inLanguage: 'en',
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      instructor: {
        '@type': 'Person',
        name: 'Darvin Yi',
      },
    },
  };
} else if (kind === 'chapter') {
  jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: title,
    description,
    url: `${SITE_URL}/${slug}/`,
    learningResourceType: 'Tutorial chapter',
    inLanguage: 'en',
    isPartOf: {
      '@type': 'Course',
      name: 'LLM Tutorial',
      url: `${SITE_URL}/`,
    },
    position: chapterNum,
    educationalLevel: 'Advanced',
    author: {
      '@type': 'Person',
      name: 'Darvin Yi',
      url: 'https://darvinyi.com',
    },
    ...(partName ? { educationalAlignment: { '@type': 'AlignmentObject', alignmentType: 'concept', targetName: partName } } : {}),
  };
}

const jsonLdString = JSON.stringify(jsonLd);
---

<script type="application/ld+json" set:html={jsonLdString} />
```

### 6. Astro config — sitemap integration

```js
// astro.config.mjs

import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://llm-tutorial.darvinyi.com',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/draft/') && !page.includes('/_dev/'),
      changefreq: 'monthly',
      lastmod: new Date(),
      priority: 0.7,
      // Optional: customize entries (e.g., home page priority 1.0)
      serialize: (item) => {
        if (item.url === 'https://llm-tutorial.darvinyi.com/') {
          item.priority = 1.0;
          item.changefreq = 'weekly';
        }
        return item;
      },
    }),
    // ... existing integrations
  ],
});
```

### 7. Layout updates

`ChapterLayout.astro` head:

```astro
---
import SEO from '../components/seo/SEO.astro';
import JsonLd from '../components/seo/JsonLd.astro';

const { slug, num, title, description, partName, publishedDate } = Astro.props;
---

<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    
    <SEO
      title={`Chapter ${num}: ${title}`}
      description={description}
      slug={slug}
      type="article"
      publishedTime={publishedDate}
    />
    <JsonLd
      kind="chapter"
      slug={slug}
      title={title}
      description={description}
      chapterNum={num}
      partName={partName}
    />
    
    <!-- Existing critical-font preload (session 136) -->
    <link rel="preload" href="/fonts/Inter-Regular.woff2" as="font" type="font/woff2" crossorigin />
    <!-- ... -->
  </head>
  <body>
    <!-- existing body -->
  </body>
</html>
```

Equivalent for `HomeLayout.astro` (with `kind="home"` JsonLd, `type="website"` SEO).

### 8. `public/robots.txt`

```txt
User-agent: *
Allow: /
Disallow: /_dev/
Disallow: /draft/

Crawl-delay: 1

Sitemap: https://llm-tutorial.darvinyi.com/sitemap-index.xml
```

---

## Acceptance criteria

All must hold:

1. **`npm install`** completes without errors. New dependencies in `package.json`: `satori`, `satori-html`, `@resvg/resvg-js`, `@astrojs/sitemap`.
2. **`npm run build:og-cards`** completes. `public/og/` contains 31 PNGs (30 chapters + home).
3. **Each chapter OG card** is 1200×630 PNG, < 200 KB, with the chapter number, title, part name, and curriculum branding.
4. **`npm run build`** completes. Sitemap is emitted at `dist/sitemap-index.xml` and `dist/sitemap-0.xml`. Includes all 30 chapter URLs + home.
5. **`<SEO>` component** renders correct meta tags on every chapter page. View source on Ch 30 confirms: title, description, canonical, og:type=article, og:image=/og/ch30-agent-eval-and-frameworks.png, twitter:card=summary_large_image.
6. **`<JsonLd>` component** renders valid `LearningResource` JSON-LD on every chapter page; `Course` JSON-LD on home.
7. **JSON-LD validation**: paste the rendered JSON-LD into [Google's Rich Results Test](https://search.google.com/test/rich-results) — no errors.
8. **OG card preview**: paste a chapter URL into [opengraph.xyz](https://www.opengraph.xyz/) or similar — the custom card renders with the chapter's identity.
9. **Sitemap validity**: `dist/sitemap-index.xml` validates against the [XML Sitemap protocol](https://www.sitemaps.org/protocol.html). All URLs use `https://llm-tutorial.darvinyi.com/`.
10. **Robots.txt**: `dist/robots.txt` exists; references the sitemap; disallows expected paths.
11. **Lighthouse SEO category** ≥ 95 on all 3 audited chapters (Ch 1, Ch 15, Ch 30).
12. **Twitter Card validator** (if available) shows the card preview correctly for sample URLs.
13. **`npm run typecheck`** passes.
14. **Total OG card storage**: < 6 MB across 31 cards (≈ < 200 KB each).
15. **Build time impact**: prebuild step adds < 30 seconds for OG card generation.

---

## Out of scope

- ❌ **Do not implement RSS / Atom feeds** in this session. Could be a future addition.
- ❌ **Do not implement view transitions** in this session.
- ❌ **Do not add analytics tracking** in this session.
- ❌ **Do not modify any chapter MDX file** (chapter metadata flows through the layout props, not MDX).
- ❌ **Do not customize per-chapter OG cards with chapter-specific imagery**. All cards follow the same template; differentiation is via the chapter number + title.

---

## Wire-up

```bash
git add scripts/build-og-cards.mjs src/og-template.tsx src/components/seo/ src/layouts/ChapterLayout.astro src/layouts/HomeLayout.astro astro.config.mjs public/robots.txt package.json package-lock.json public/og/
git commit -m "session 137 (polish 6 — FINAL): social meta + OG cards + JSON-LD + sitemap. BUILD COMPLETE."
git push origin main
```

---

## Notes for the session author

**On this being the final session of the entire build**:
After this commit, the build is complete. 30 chapters specified and published; 6 polish sessions specified covering linking, search, mobile, accessibility, performance, discoverability. **The 177-file build closes here.** Notes-for-author: "**The next person to add work to this repo will be doing post-launch maintenance, not initial build.** Treat this session's commit message as the build log's final entry. **The polish is done.**"

**On build-time OG card generation being the right primitive**:
Per-chapter OG cards rendered at build time produce static PNGs that work on any CDN, any cache, any preview tool. **No runtime image generation, no edge functions, no per-request cost.** Notes-for-author: "**OG cards are static assets; treat them as such.** Build once, ship to CDN, every preview anywhere uses the cached PNG."

**On Satori + resvg being the lightweight render path**:
Satori (Vercel) renders JSX to SVG without a full browser. resvg converts SVG to PNG via Rust bindings. Total: ~5 MB of dependencies, ~500ms per card. Notes-for-author: "**No Puppeteer, no headless Chrome.** A simpler render path that runs anywhere Node runs."

**On the OG card template visually matching the site**:
Dark background, cyan accent, three font families — the same visual vocabulary as the chapters themselves. Notes-for-author: "**The card should feel like the chapter.** Reader who clicks through the OG card lands on a page that looks like the card promised. **Consistency builds trust.**"

**On the chapter number being a visual anchor in the card**:
The bottom-right "Chapter N" badge gives every card a distinctive identifier even at thumbnail size. Notes-for-author: "**At Twitter card size (~660 px wide), large text shrinks; the chapter number stays legible.** The badge is the card's identity at every scale."

**On JSON-LD being the discoverability multiplier**:
Schema.org structured data lets search engines (and AI crawlers) understand the curriculum's structure: it's a Course, with 30 LearningResource children, organized by Parts. Notes-for-author: "**The crawler reads JSON-LD before it reads HTML.** A curriculum tagged as a Course with positioned LearningResources gets richer search results — and surfaces in 'how to learn LLMs' queries."

**On the sitemap + robots.txt being the crawler's contract**:
Sitemap tells crawlers what exists; robots.txt tells them what to crawl. Together they're the curriculum's interface to search engines. Notes-for-author: "**Without a sitemap, search engines have to discover 30 chapters one link at a time.** With a sitemap, they discover all 30 immediately. **Crawl budget matters; the sitemap respects it.**"

**On the `summary_large_image` Twitter Card being the modern default**:
1200×630 is the recommended OG image size; `summary_large_image` is the Twitter Card type that uses it. Notes-for-author: "**Twitter Card preview is what your readers see in their feed.** Without an image, your link is a generic blue chunk. With a custom card, your link signals 'I made this; here's what's inside.' **The card is the curriculum's first impression in 80% of share contexts.**"

**On the canonical URL preventing duplicate content penalties**:
`<link rel="canonical" href="https://llm-tutorial.darvinyi.com/ch30-...">` tells search engines the authoritative URL even if the page is reached via a different URL (mobile m. variant, query parameters, etc.). Notes-for-author: "**Canonical URLs prevent search-ranking dilution.** Multiple URLs pointing to the same content split ranking signal; canonical re-merges them."

**On theme-color affecting the browser chrome**:
On mobile browsers (especially Chrome on Android), `<meta name="theme-color">` colors the address bar to match the page. Notes-for-author: "**Small detail, large polish.** A reader scrolling a chapter sees the address bar tinted to the site's dark color; the visual coherence extends to the browser frame."

**On the FINAL session being structurally identical to earlier polish sessions**:
Same audit-then-fix structure; same single-place changes shipping site-wide; same out-of-scope discipline. Notes-for-author: "**The polish phase has been six instances of the same pattern.** Linking, search, mobile, accessibility, performance, discoverability — all shipped from one place each. **The pattern is the methodology.**"

**Pedagogical claim this session supports**:
"**The 30-chapter curriculum is findable, shareable, and discoverable.** A search-engine crawler discovers all 30 chapters via the sitemap. A reader sharing a chapter link on Twitter/Slack/Discord/wherever gets a custom card with the chapter's identity. A search-engine result page surfaces the chapter as a structured `LearningResource` within a positioned `Course`. **The curriculum doesn't just exist; it announces itself.**"

---

## 🎯 The build closes here

After this commit, the build is **complete**:

- ✅ **Foundation phases (sessions 1-15)** — site scaffolding, design system, content components
- ✅ **Chapter phases (sessions 16-131)** — all 30 chapters specified, all widgets built, all exercises shipped
- ✅ **Polish phase (sessions 132-137)** — cross-chapter linking, search, mobile, accessibility, performance, discoverability

**Total: 177 build-session prompts. 30 published chapters. 9 curriculum parts. Every layer of the modern LLM stack covered with engineering rigor and honest framing.**

**Phase 15 — the agent stack — closed:**
- ✅ Ch 27 Agent foundations
- ✅ Ch 28 Agents from scratch  
- ✅ Ch 29 Multi-agent
- ✅ Ch 30 Agent eval and frameworks

**The curriculum is published. The polish is done. The build is closed.**

---

The closing thought from Ch 30 § 8:

> *Thirty chapters. From the first matrix multiplication to the last production agent. You started with numpy and ended with systems that observe, think, act, and iterate at production scale. The field will keep moving — new architectures, new capabilities, new failure modes, new disciplines. **What this curriculum gave you is the foundation to follow.***
>
> *The transformer block is still the same matrix-multiplication-and-softmax it was in Chapter 4. The agent loop is still the same observe-think-act it was in Chapter 27. **The principles don't change as fast as the products.** When the next breakthrough lands — and it will — you'll be reading the paper with the substrate to understand it.*
>
> ***That's what this curriculum was for.***
>
> ***Now go build.***

🎓
