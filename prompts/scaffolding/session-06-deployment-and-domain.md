# Session 06 — Deployment, custom domain, and Phase 2 closeout

> Final scaffolding session. Takes the working local site and ships it to `https://llm-tutorial.darvinyi.com` via Vercel + Namecheap DNS. Verifies Pagefind indexing runs in the production build. Removes test artifacts. Closes Phase 2 at Checkpoint B.

---

## Read first

Before running any commands, read these files:

- `MASTER_PLAN.md` — for Checkpoint B's exit criteria
- `context/PROJECT_OVERVIEW.md` — for the "no analytics, no email capture, no marketing" stance
- `context/TECH_STACK.md` — **especially "Build and deploy" and "Performance budget" sections**
- `prompts/scaffolding/session-01-repo-init.md` through `session-05-pyodide-runnable-code.md` — confirm those sessions completed successfully before starting this one

This session is **partly manual** — it includes Vercel UI clicks and Namecheap DNS edits that no script can perform. The "Detailed spec" below walks through every step.

---

## Goal

By the end of this session:

- `https://llm-tutorial.darvinyi.com` is **live**, serving the real landing page, with HTTPS provisioned automatically by Vercel
- Pushing to `main` triggers an auto-deploy; PRs get preview URLs
- The placeholder Ch 1 page at `/ch01-neural-net-primitives/` is reachable via direct URL (sidebar still shows it as disabled — correct, since real content lands in Phase 3)
- `npm run build` produces `dist/pagefind/` with the search index, ready for the Phase 13 search-UI session to consume
- Test artifacts (`test-mdx.mdx`, `placeholder-figure.svg`) are removed
- A basic `robots.txt` exists
- Lighthouse on the production URL shows Performance > 95 desktop, Accessibility = 100

---

## Inputs

State of the repo after sessions 01–05:

- Working local dev server with full design system, MDX pipeline, layout chrome, and Pyodide
- `/test-mdx` page exists and works (to be deleted in this session)
- `/ch01-neural-net-primitives/` shows a placeholder using `ChapterLayout` (kept; replaced by real content in Phase 3)
- `package.json` has `"build": "astro build && pagefind --site dist"`
- The GitHub repo `github.com/yidarvin/darvinyi-llm-tutorial` exists with all session 01–05 commits pushed to `main`

You also need:
- Admin access to the Vercel account intended to host this project
- Admin access to the Namecheap account managing `darvinyi.com`

---

## Deliverables

### Code/repo changes

1. **Delete** `src/pages/test-mdx.mdx`
2. **Delete** `public/test/placeholder-figure.svg` and the empty `public/test/` directory
3. **Create** `public/robots.txt`
4. **Create** `public/og-image-placeholder.svg` — a placeholder OG image (session 142 in Phase 13 generates the real one)

### External configuration (no repo changes)

5. **Vercel project** created and linked to `github.com/yidarvin/darvinyi-llm-tutorial`
6. **Custom domain** `llm-tutorial.darvinyi.com` configured in Vercel and Namecheap
7. **HTTPS** provisioned (Vercel does this automatically once DNS resolves)

### Verification

8. Production site is live and matches local dev
9. Lighthouse audit passes the targets in `TECH_STACK.md` "Performance budget"
10. Pagefind index is present at `https://llm-tutorial.darvinyi.com/pagefind/pagefind.js` (returns a JS file, not a 404)

---

## Detailed spec

### Part A — Cleanup (do this first, locally)

#### A.1 Delete test artifacts

```bash
# From repo root
rm src/pages/test-mdx.mdx
rm -r public/test
```

Verify with `git status`:
- `D  public/test/placeholder-figure.svg`
- `D  src/pages/test-mdx.mdx`

#### A.2 Create `public/robots.txt`

```
User-agent: *
Allow: /

Sitemap: https://llm-tutorial.darvinyi.com/sitemap-index.xml
```

Standard "allow everything" + pointer to the sitemap (which `@astrojs/sitemap` generates at build time as `sitemap-index.xml` plus `sitemap-0.xml`).

#### A.3 Create `public/og-image-placeholder.svg`

A minimal placeholder OG image. Session 142 (Phase 13) will generate the real one — likely 1200×630 PNG with the site title rendered in Inter on the cyan-on-dark palette. For now, this SVG suffices for `<meta property="og:image">` references without 404'ing.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0a0a0a"/>
  <circle cx="600" cy="315" r="450" fill="url(#glow)" opacity="0.15"/>
  <defs>
    <radialGradient id="glow">
      <stop offset="0%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#06b6d4" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <text x="600" y="280" font-family="Inter, system-ui, sans-serif" font-size="72" fill="#f5f5f5" text-anchor="middle" font-weight="700" letter-spacing="-2">
    LLM Tutorial
  </text>
  <text x="600" y="360" font-family="Inter, system-ui, sans-serif" font-size="32" fill="#06b6d4" text-anchor="middle">
    From numpy to agents
  </text>
  <text x="600" y="540" font-family="JetBrains Mono, monospace" font-size="20" fill="#737373" text-anchor="middle" letter-spacing="2">
    DARVINYI.COM
  </text>
</svg>
```

`BaseLayout.astro` already has `<meta property="og:title">` and `<meta property="og:description">` from session 02. We do NOT add `<meta property="og:image">` to BaseLayout in this session — session 142 handles per-chapter OG images and the global default. The SVG above lives in `public/` ready for session 142 to reference or replace.

#### A.4 Commit the cleanup

```bash
git add public/robots.txt public/og-image-placeholder.svg
git rm src/pages/test-mdx.mdx public/test/placeholder-figure.svg
git commit -m "session 06a: remove test artifacts, add robots.txt and OG placeholder"
git push origin main
```

This commit must land **before** the Vercel deploy so the production build doesn't include `/test-mdx`.

#### A.5 Local build verification

```bash
npm run build
```

Confirm:
- Build completes with zero errors
- `dist/` contains `index.html`, `404.html`, `ch01-neural-net-primitives/index.html`
- `dist/` does NOT contain `test-mdx/` or `test/placeholder-figure.svg`
- `dist/sitemap-index.xml` and `dist/sitemap-0.xml` exist
- `dist/pagefind/` exists with `pagefind.js`, `pagefind-ui.js`, `pagefind-ui.css`, and a fragment/index folder
- `dist/robots.txt` exists

Then:

```bash
npm run preview
```

Open `http://localhost:4321/` and verify the production build looks identical to dev. Specifically:
- Landing page renders
- `/ch01-neural-net-primitives/` renders inside `ChapterLayout` with placeholder content
- `<RunnableCode>` block on Ch 1 placeholder works (click Run, see numpy output)
- `/test-mdx` returns 404 (or the custom 404 page)

If all of the above checks pass, proceed to Part B.

### Part B — Vercel project setup

Manual steps in the Vercel UI.

#### B.1 Create the Vercel project

1. Sign in to https://vercel.com
2. Click **Add New → Project**
3. **Import Git Repository** → select `yidarvin/darvinyi-llm-tutorial`
4. **Configure Project**:
   - **Project Name**: `darvinyi-llm-tutorial` (or accept the default)
   - **Framework Preset**: Astro (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (auto-detected; verify it's correct)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm install` (default)
   - **Node.js Version**: 20.x (matches `.nvmrc`)
   - **Environment Variables**: none — leave empty
5. Click **Deploy**

Vercel will run `npm install` then `npm run build`. First build takes 2-5 minutes. Watch the build logs. If the build fails:
- Most common cause: a peer-dep error that npm warns about locally but Vercel treats more strictly. Check the build log, identify the offending dep, and pin its version in `package.json`.
- Second most common: Node version mismatch. Verify `.nvmrc` says `20`.

Once the build succeeds, Vercel gives you a default URL like `darvinyi-llm-tutorial-xxx.vercel.app`. Visit it and verify the site works.

#### B.2 Test the Vercel preview

On the Vercel default URL:
- Landing page loads with proper styling, fonts, cyan accents
- `/ch01-neural-net-primitives/` renders inside `ChapterLayout`
- `<RunnableCode>` works (click Run; Pyodide loads from `cdn.jsdelivr.net`; output shows)
- `/some-nonexistent-path` shows the custom 404 page
- `/sitemap-index.xml` returns valid XML
- `/pagefind/pagefind.js` returns a JS file (this is the Pagefind runtime; UI integration comes in Phase 13)
- `/robots.txt` returns the robots.txt content

If everything works, continue to Part C. If anything is broken on Vercel but works locally, the most likely culprits are:
- A file Vercel didn't include in the deploy (check `.vercelignore` — there shouldn't be one)
- A case-sensitive filesystem issue (Vercel runs Linux; macOS is case-insensitive; rename if needed)
- A Pyodide CORS issue (rare but possible; check browser console)

### Part C — Custom domain configuration

This is the most failure-prone part. Two systems (Vercel + Namecheap) need to agree on DNS.

#### C.1 Add the domain in Vercel

1. In Vercel project dashboard → **Settings** → **Domains**
2. Click **Add** → enter `llm-tutorial.darvinyi.com`
3. Vercel will say "DNS Configuration Required" and show the target CNAME: typically **`cname.vercel-dns.com`**

Note the exact CNAME target Vercel displays. Use that exactly in the next step.

#### C.2 Add the CNAME in Namecheap

1. Sign in to https://namecheap.com
2. Go to **Domain List** → find `darvinyi.com` → click **Manage**
3. Click the **Advanced DNS** tab
4. Click **Add New Record**:
   - **Type**: CNAME Record
   - **Host**: `llm-tutorial`
   - **Value**: `cname.vercel-dns.com.` (use exactly what Vercel told you in step C.1; include the trailing dot)
   - **TTL**: Automatic (5 minutes)
5. Click the green checkmark to save

Do NOT add a `www.llm-tutorial` variant. Subdomains don't need `www.` prefixes.

Do NOT add a TXT verification record. Vercel uses CNAME-target matching to verify ownership for subdomains; no TXT needed (TXT verification is only for apex domains like `darvinyi.com` itself).

#### C.3 Wait for DNS propagation

Typically 1–5 minutes. Check propagation:

```bash
dig llm-tutorial.darvinyi.com CNAME +short
```

Expected output: `cname.vercel-dns.com.`

If you see something else (or nothing), DNS hasn't propagated yet. Wait another 5 minutes and retry. If after 30 minutes you still don't see the CNAME, the record may not have been saved correctly — return to Namecheap and verify.

#### C.4 Verify in Vercel

Once DNS resolves, refresh the Vercel **Domains** page. The status next to `llm-tutorial.darvinyi.com` should change from "Invalid Configuration" to "Valid Configuration". Vercel will automatically provision an SSL certificate via Let's Encrypt — this takes another 30–60 seconds.

When the SSL is provisioned, visit `https://llm-tutorial.darvinyi.com`. You should see the landing page over HTTPS with a valid certificate.

### Part D — Production verification

With the custom domain live, run through the full acceptance checklist.

#### D.1 Functional verification

In a fresh browser (no caching):

- **`https://llm-tutorial.darvinyi.com/`** loads the landing page with no errors
- **`https://llm-tutorial.darvinyi.com/ch01-neural-net-primitives/`** loads the placeholder chapter inside `ChapterLayout`
- **`<RunnableCode>` on the chapter page** works end-to-end: click Run, see Python output (~5s on first click for Pyodide load)
- **Sidebar (desktop) shows all 30 chapters** with Ch 1 highlighted as current; all others dimmed/disabled
- **TOC (≥ 1280px width) shows the headings** of the placeholder chapter, active section highlights as you scroll
- **Resize to 900px** — sidebar collapses, hamburger button appears
- **Tap hamburger on mobile** — slide-in overlay works
- **`/404`** shows the custom 404 page (manually visit `https://llm-tutorial.darvinyi.com/foo` to trigger)
- **`/sitemap-index.xml`** returns valid XML listing all pages
- **`/robots.txt`** returns the robots content
- **`/pagefind/pagefind.js`** returns a JS file (200, not 404)

#### D.2 Lighthouse audit

Run Lighthouse on production:

```bash
npx lighthouse https://llm-tutorial.darvinyi.com/ --view --preset=desktop
```

(Or use Chrome DevTools → Lighthouse tab.)

Required scores:
- **Performance**: > 95 (desktop), > 85 (mobile)
- **Accessibility**: 100 (hard requirement per `MASTER_PLAN.md`)
- **Best Practices**: > 95
- **SEO**: > 90

If any score is below target, investigate:
- **Performance** issues are usually:
  - Font loading (verify `font-display: swap` is set; not blocking)
  - Image optimization (no large images yet, should be fine)
  - JS bundle size (run `npm run build` and check `dist/_astro/` sizes)
- **Accessibility** issues are usually:
  - Missing alt text (none in the scaffolding pages; Figure component requires caption)
  - Color contrast (the design system was calibrated for AAA — should pass)
  - Missing form labels (only form-ish element is `<RunnableCode>`'s button; verify aria-label)
- **Best Practices** issues are often `console.warn`s — check browser console
- **SEO** issues are usually missing meta tags (BaseLayout sets canonical, description, OG title/description; that should be enough)

#### D.3 Verify production Pyodide load

In a fresh incognito window (no Pyodide cache):

1. Open `https://llm-tutorial.darvinyi.com/ch01-neural-net-primitives/`
2. Open DevTools → Network tab
3. Filter to "JS/WASM/Fetch"
4. Click **Run** on the `<RunnableCode>` block
5. Verify:
   - Requests go to `cdn.jsdelivr.net/pyodide/v0.26.4/full/` (NOT to your own domain)
   - `pyodide.asm.wasm` downloads (~7 MB) — this is the big one
   - numpy fetches (~5 MB)
   - Total load takes 4-10 seconds depending on connection
6. Output appears: numpy version, array shape, etc.
7. Click **Run** again — instant, no new network requests

If Pyodide fails to load with CORS errors, the issue is likely the CDN URL. Verify `v0.26.4` exists at jsdelivr by visiting `https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js` directly. If 404, update `PYODIDE_VERSION` in `src/lib/pyodide.ts` to the latest available stable version, commit, and re-deploy.

#### D.4 Auto-deploy verification

Make a trivial change to trigger an auto-deploy:

```bash
# Add a line to README.md
echo "" >> README.md
echo "## Deployment" >> README.md
echo "" >> README.md
echo "Auto-deployed to https://llm-tutorial.darvinyi.com via Vercel on push to main." >> README.md

git add README.md
git commit -m "session 06: README deployment note"
git push origin main
```

In Vercel → Deployments tab: a new deployment should kick off within ~10 seconds. It should complete successfully in 2-3 minutes. Once green, refresh the production URL and confirm the site still works.

---

## Acceptance criteria

All must hold:

1. **`https://llm-tutorial.darvinyi.com/`** is live, serves the real landing page over HTTPS, with a valid TLS certificate
2. **DNS resolution**: `dig llm-tutorial.darvinyi.com CNAME +short` returns `cname.vercel-dns.com.`
3. **`/sitemap-index.xml`** is reachable and valid
4. **`/robots.txt`** is reachable and contains the expected content
5. **`/pagefind/pagefind.js`** is reachable (200, not 404)
6. **`/ch01-neural-net-primitives/`** renders the placeholder; `<RunnableCode>` block executes Python via Pyodide
7. **`/test-mdx`** returns 404 (the test page was deleted)
8. **`/foo` (any nonexistent path)** returns the custom 404 page
9. **Mobile layout** (375px wide): hamburger button visible top-right; tap opens slide-in nav
10. **Desktop layout** (1440px): sidebar visible on left, TOC visible on right, chapter content centered
11. **Lighthouse audit** scores:
    - Performance ≥ 95 desktop, ≥ 85 mobile
    - Accessibility = 100
    - Best Practices ≥ 95
    - SEO ≥ 90
12. **Auto-deploy** verified: pushing a trivial commit to `main` triggers a new Vercel build that succeeds
13. **No analytics scripts** loaded in production (verify via DevTools → Network; nothing from `googletagmanager.com`, `google-analytics.com`, etc.)
14. **Final repo state**:

```
darvinyi-llm-tutorial/
├── .gitignore, .nvmrc, README.md
├── MASTER_PLAN.md, BUILD_ORDER.md
├── astro.config.mjs, tailwind.config.mjs, tsconfig.json
├── package.json, package-lock.json
├── context/                         (4 files)
├── prompts/scaffolding/             (6 files)
├── public/
│   ├── favicon.svg
│   ├── og-image-placeholder.svg     ← new
│   ├── robots.txt                   ← new
│   └── fonts/
│       ├── inter/
│       └── jetbrains-mono/
└── src/
    ├── components/
    │   ├── code/                    (RunnableCode + module CSS + index)
    │   ├── content/                 (5 Astro components + index)
    │   └── nav/                     (5 Astro components)
    ├── layouts/
    │   ├── BaseLayout.astro
    │   └── ChapterLayout.astro
    ├── lib/
    │   ├── chapters.ts
    │   ├── pyodide.ts
    │   └── seeded-prng.ts
    ├── pages/
    │   ├── 404.astro
    │   ├── index.astro
    │   └── ch01-neural-net-primitives/
    │       └── index.astro          (placeholder; replaced in Phase 3)
    ├── styles/
    │   ├── base.css, content.css, fonts.css, global.css, variables.css
    └── env.d.ts
```

---

## Out of scope

- ❌ **Do not write any chapter content.** Chapters arrive in Phases 3–12. Phase 2's job ends here.
- ❌ **Do not add the search UI.** Pagefind is configured to BUILD the index; the UI integration is session 138 in Phase 13. The build script already runs Pagefind; we're done.
- ❌ **Do not generate the real OG image.** Session 142 in Phase 13 handles this. The placeholder SVG is enough for now.
- ❌ **Do not add analytics.** Documented decision in `MASTER_PLAN.md` — no GA, no Plausible, no Vercel Analytics opt-in.
- ❌ **Do not add a comment system.** Same.
- ❌ **Do not add an `og-image` meta tag to `BaseLayout`.** Session 142.
- ❌ **Do not configure `vercel.json`** unless absolutely required (it isn't). Vercel's Astro auto-config handles routing.
- ❌ **Do not delete the placeholder Ch 1 page** (`src/pages/ch01-neural-net-primitives/index.astro`). Phase 3 session 07 replaces it; deleting now creates a gap.
- ❌ **Do not flip Ch 1's status in `chapters.ts` to 'published'.** It remains 'planned' until real content lands.

---

## Wire-up

After all acceptance criteria pass, the session is complete. The cleanup commit (Part A) was already pushed. The Vercel/Namecheap configuration lives outside the repo. No additional `git add/commit/push` is needed beyond what Part A did.

The README has the deployment URL — anyone visiting the repo finds the live site.

---

## Checkpoint B — Phase 2 closeout

This is the official end of Phase 2 per `MASTER_PLAN.md`.

**The site is live. The infrastructure works. The build is reproducible.**

Before moving to Phase 3 (chapter content), confirm:

- ✅ All 11 ⬜ from Phase 1 + Phase 2 have flipped to ✅ in `BUILD_ORDER.md`
- ✅ The production URL is bookmarked
- ✅ Vercel auto-deploys are working
- ✅ Pyodide loads correctly in production (verified in incognito)
- ✅ Lighthouse targets are met

If anything above is unchecked, return to the relevant session and fix before starting Phase 3.

---

## Notes for the session author

**If Vercel's auto-detected framework is not Astro**, manually select "Astro" from the dropdown. Vercel sometimes guesses wrong with monorepo-like structures.

**If `npm install` fails on Vercel but works locally**, the most common cause is the `node_modules/.bin/` symlinks. Vercel runs `npm ci` (clean install) by default; if `package-lock.json` is out of sync, that fails. Run `npm install` locally one more time to refresh the lockfile, commit, and push.

**If the Vercel build succeeds but the deployed site shows a 500 error**, check the Vercel Functions logs (left sidebar in the project). Astro is a static-only site for this project — there should be no serverless functions. If there are, something in `astro.config.mjs` is misconfigured (most likely `output: 'server'` was set somewhere; it should be the default `'static'`).

**If `dig llm-tutorial.darvinyi.com` returns nothing**, the CNAME record either wasn't saved or hasn't propagated. Wait 10 minutes and retry. Namecheap's DNS propagation is usually fast (< 5 minutes) but occasionally takes up to an hour.

**If Vercel says "Invalid Configuration" for the domain even after DNS propagates**, the CNAME value may have a trailing dot mismatch. Namecheap's UI sometimes adds or strips the trailing dot. The correct value is `cname.vercel-dns.com.` (with the trailing dot in the Namecheap interface, though Vercel displays it without). If Vercel still says invalid, click the "Refresh" button in Vercel's domain settings — sometimes it just needs a re-check.

**If the SSL certificate doesn't provision** (the lock icon never appears, or the browser warns about an invalid cert), Vercel's Let's Encrypt integration may be delayed. Wait 10 minutes. If still failing after 30 minutes, contact Vercel support — this is rare but happens.

**If Lighthouse Performance is below 95**, the most likely culprit is font-loading-related Cumulative Layout Shift. The `font-display: swap` in `fonts.css` should prevent FOUT. If CLS is bad, the issue is fonts swapping after content has rendered. Verify the `<link rel="preload">` directives for fonts are present (they're added by Astro automatically for fonts referenced in CSS, but worth checking via DevTools → Network).

**If Lighthouse Accessibility is below 100**, the issue is almost certainly:
- A heading-order skip (h1 → h3 with no h2)
- A button without `aria-label` (check `RunnableCode`'s Reset button)
- An interactive element missing keyboard focus styling (rare; the focus-visible rule in `variables.css` covers this)

**If Pagefind isn't producing an index**, the build script may have run `astro build` successfully but `pagefind` may have errored. Check the Vercel build log for the line `Indexed X pages`. If it says `Indexed 0 pages`, Pagefind isn't finding HTML files in `dist/`. Verify `npm run build` locally produces `dist/index.html` and `dist/ch01-neural-net-primitives/index.html` — if those are missing, the build is broken upstream.

This is the last scaffolding session. The site is now ready for content. Take a moment before moving to Phase 3 — verify everything one more time, screenshot the live landing page, and savor that the foundation is real.

After this session, the build cadence shifts: instead of generating one prompt every few hours and committing immediately, chapter sessions can be batched. The recommended rhythm from `MASTER_PLAN.md`:

- One chat message per file (research file OR session prompt)
- Hand 4–5 files to Claude Code at a time
- Build → review → commit, then continue

The deployment infrastructure won't be touched again until Phase 13.
