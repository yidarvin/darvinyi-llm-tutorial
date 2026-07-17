// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astroPlugin from 'eslint-plugin-astro';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

// Uses the (deprecated-but-functional) tseslint.config() helper rather than
// ESLint core's newer defineConfig(): eslint-plugin-react-hooks v7's own
// published types are incompatible with defineConfig's stricter `plugins`
// typing (a mismatch inside the plugin's `configs.flat` shape, not
// something fixable from this file), which turns astro check's *type*
// pass on this config file into a hard TS error. tseslint.config() only
// costs a harmless "deprecated" hint from astro check — 0 errors.
export default tseslint.config(
  {
    ignores: ['dist/**', '.astro/**', 'node_modules/**', 'public/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astroPlugin.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      // Only the two classic, uncontroversial hooks-correctness rules.
      // eslint-plugin-react-hooks v7's `recommended` config also bundles the
      // newer React Compiler "safety" diagnostics (set-state-in-effect,
      // preserve-manual-memoization, etc.), which flag this codebase's
      // documented house pattern for widget animation — a useEffect driving
      // setTimeout/requestAnimationFrame, calling setState from inside the
      // loop or its cleanup (see context/TECH_STACK.md, "Animation
      // cleanup"). That pattern is correct here and was independently
      // verified clean (deterministic, cleaned-up) during the repo audit
      // this config exists to codify; adopting the compiler ruleset would
      // force large widget rewrites out of scope for basic lint hygiene.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Catches the exact class of bug this config was added to prevent: a
      // promise (e.g. the search-index fetch) awaited with no error path,
      // so a rejection becomes an unhandled rejection instead of visible
      // user-facing state.
      '@typescript-eslint/no-floating-promises': 'error',
      // Widget/script modules intentionally reach for `any` at real
      // boundaries (the untyped Pyodide runtime, generic data-module
      // sweeps); keep it visible rather than banning it outright.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    // .mjs build/check scripts run under plain Node, not the browser/Astro
    // TS project — lint them for correctness without type-aware rules.
    files: ['scripts/**/*.mjs', '*.config.mjs'],
    languageOptions: {
      parserOptions: {
        project: null,
      },
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
  {
    files: ['**/*.astro'],
    rules: {
      // Astro components commonly declare props that aren't all read in
      // every branch of the template; the astro plugin's own recommended
      // set already covers real astro-specific correctness issues.
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    // src/env.d.ts is Astro's own generated ambient-types file (`astro
    // sync`) — the triple-slash reference is the only valid way to pull in
    // an ambient .d.ts here, there is no import-style equivalent.
    files: ['src/env.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  }
);
