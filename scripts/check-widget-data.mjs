#!/usr/bin/env node
// Regression checks for numeric claims rendered by high-risk widget data.
// These modules are TypeScript-only data/math modules with no runtime imports;
// transpiling them here keeps the assertions close to the values readers see.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

const ROOT = process.cwd();
const WIDGETS_DIR = resolve(ROOT, 'src/components/widgets');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

// Most data modules are self-contained, but a few import a shared leaf
// utility (e.g. `@lib/seeded-prng`) via the tsconfig path aliases. Resolve
// just the aliases that appear in src/lib, src/components, src/styles —
// enough for these data/math modules without a full bundler.
const ALIAS_ROOTS = {
  '@lib/': 'src/lib/',
  '@components/': 'src/components/',
  '@styles/': 'src/styles/',
};
const moduleCache = new Map();

function resolveSpecifier(specifier, fromDir) {
  if (specifier.startsWith('.')) {
    return resolve(fromDir, specifier.endsWith('.ts') ? specifier : `${specifier}.ts`);
  }
  for (const [alias, target] of Object.entries(ALIAS_ROOTS)) {
    if (specifier.startsWith(alias)) {
      const rest = specifier.slice(alias.length);
      return resolve(ROOT, target, rest.endsWith('.ts') ? rest : `${rest}.ts`);
    }
  }
  return null; // a real npm package — not expected in these data modules
}

function loadDataModule(path) {
  if (moduleCache.has(path)) return moduleCache.get(path);

  const source = readFileSync(path, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: path,
  }).outputText;
  const context = { exports: {}, module: { exports: {} } };
  context.exports = context.module.exports;
  context.require = (specifier) => {
    const resolved = resolveSpecifier(specifier, resolve(path, '..'));
    if (!resolved) {
      throw new Error(`${relative(ROOT, path)}: cannot resolve non-aliased import "${specifier}" in the widget-data sandbox`);
    }
    return loadDataModule(resolved);
  };
  vm.runInNewContext(output, context, { filename: path });
  moduleCache.set(path, context.module.exports);
  return context.module.exports;
}

function approximatelyEqual(actual, expected, relativeTolerance = 1e-9) {
  return Math.abs(actual - expected) <= Math.max(1, Math.abs(expected)) * relativeTolerance;
}

const optimizerPath = resolve(ROOT, 'src/components/widgets/ch08/optimizer-data.ts');
const optimizer = loadDataModule(optimizerPath);
for (const spec of optimizer.OPTIMIZERS) {
  assert(
    spec.trajectory.length === optimizer.N_STEPS + 1,
    `${relative(ROOT, optimizerPath)}: ${spec.label} trajectory must expose every displayed step`,
  );
  const start = spec.trajectory[0];
  const end = spec.trajectory.at(-1);
  assert(
    spec.trajectory.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.loss)),
    `${relative(ROOT, optimizerPath)}: ${spec.label} trajectory contains a non-finite plotted value`,
  );
  assert(
    end.loss < start.loss * 0.01,
    `${relative(ROOT, optimizerPath)}: ${spec.label} should visibly converge rather than refute the widget lesson`,
  );
}
const adamEnd = optimizer.TRAJ_ADAM.at(-1);
const adamwEnd = optimizer.TRAJ_ADAMW.at(-1);
assert(
  Math.hypot(adamwEnd.x, adamwEnd.y) < Math.hypot(adamEnd.x, adamEnd.y),
  `${relative(ROOT, optimizerPath)}: AdamW must finish closer to the origin than Adam to demonstrate decoupled weight decay`,
);

const scalingPath = resolve(ROOT, 'src/components/widgets/ch09/chinchilla-data.ts');
const scaling = loadDataModule(scalingPath);
for (const compute of [1e21, 6e23, 1e26]) {
  const optimum = scaling.computeOptimalAllocation(compute);
  assert(
    approximatelyEqual(6 * optimum.N * optimum.D, compute, 1e-12),
    `${relative(ROOT, scalingPath)}: compute-optimal allocation no longer satisfies 6ND=C at ${compute.toExponential()}`,
  );
  const optimumLoss = scaling.chinchillaLoss(optimum.N, optimum.D);
  for (const ratio of [0.1, 20, 250, 2000]) {
    const candidate = scaling.allocateByRatio(compute, ratio);
    assert(
      optimumLoss <= scaling.chinchillaLoss(candidate.N, candidate.D) + 1e-9,
      `${relative(ROOT, scalingPath)}: reported optimum is worse than the ${ratio}:1 D/N comparison at ${compute.toExponential()}`,
    );
  }
}

const moePath = resolve(ROOT, 'src/components/widgets/ch11/model-data.ts');
const moe = loadDataModule(moePath);
for (const model of moe.REAL_MODELS) {
  assert(
    model.activeParams <= model.totalParams,
    `${relative(ROOT, moePath)}: ${model.label} reports more active than total parameters`,
  );
  if (model.type === 'dense') {
    assert(
      model.activeParams === model.totalParams,
      `${relative(ROOT, moePath)}: dense ${model.label} must have equal active and total parameter counts`,
    );
  }
}
const config = moe.DEFAULT_CUSTOM_CONFIG;
const custom = moe.computeCustomMoEParams(config);
const effectiveK = Math.min(config.topK, config.numExperts);
const attention = 4 * config.dModel * config.dModel;
const layerNorm = 4 * config.dModel;
const router = config.numExperts * config.dModel;
const swigluPerExpert = 3 * config.dModel * config.dFFN;
const embeddings = 2 * 128_000 * config.dModel;
assert(
  custom.total === config.numLayers * (attention + layerNorm + config.numExperts * swigluPerExpert + router) + embeddings,
  `${relative(ROOT, moePath)}: total MoE count must include all three SwiGLU projections per expert`,
);
assert(
  custom.active === config.numLayers * (attention + layerNorm + effectiveK * swigluPerExpert + router) + embeddings,
  `${relative(ROOT, moePath)}: active MoE count must include only top-k experts but all shared layer terms`,
);

// Generic sweep: every widget's data module gets a NaN check on every
// exported number, however deeply nested, so a broken computation (a 0/0,
// an out-of-domain log, an undefined arithmetic op) fails the build even
// without a bespoke assertion. This deliberately does NOT flag +/-Infinity:
// several widgets use it as a legitimate sentinel (e.g. a causal attention
// mask's "-Infinity before softmax" convention), so treating it as an error
// would be a false positive on correct code, not a real regression signal.
// Exported functions are intentionally not invoked (their argument shapes
// are not known generically); this sweep only walks exported values.
function findDataModules(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      for (const inner of readdirSync(full)) {
        if (inner.endsWith('-data.ts')) found.push(join(full, inner));
      }
    }
  }
  return found.sort();
}

function checkFiniteness(value, path, issues) {
  if (typeof value === 'number') {
    if (Number.isNaN(value)) issues.push(`${path}: NaN value`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, i) => checkFiniteness(entry, `${path}[${i}]`, issues));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) {
      checkFiniteness(entry, `${path}.${key}`, issues);
    }
  }
  // functions, strings, booleans, null, undefined: nothing to check
}

const dataModules = findDataModules(WIDGETS_DIR);
for (const modulePath of dataModules) {
  const rel = relative(ROOT, modulePath);
  let exports;
  try {
    exports = loadDataModule(modulePath);
  } catch (error) {
    failures.push(`${rel}: failed to load module — ${String(error?.message ?? error)}`);
    continue;
  }
  const issues = [];
  for (const [exportName, value] of Object.entries(exports)) {
    checkFiniteness(value, `${rel}: ${exportName}`, issues);
  }
  issues.forEach((issue) => failures.push(issue));
}

// Related-chapters referential integrity: every slug referenced from
// src/lib/related-chapters.ts must resolve to a real, registered chapter —
// RelatedChapters.tsx silently drops unknown slugs, so a typo or a rename
// would otherwise lose a related-chapter card with no build failure.
const chaptersPath = resolve(ROOT, 'src/lib/chapters.ts');
const relatedPath = resolve(ROOT, 'src/lib/related-chapters.ts');
const { ALL_CHAPTERS } = loadDataModule(chaptersPath);
const { RELATED_CHAPTERS } = loadDataModule(relatedPath);
const knownSlugs = new Set(ALL_CHAPTERS.map((c) => c.slug));
let relatedEntryCount = 0;
for (const [ownerSlug, entries] of Object.entries(RELATED_CHAPTERS)) {
  assert(
    knownSlugs.has(ownerSlug),
    `${relative(ROOT, relatedPath)}: "${ownerSlug}" is not a registered chapter slug (check src/lib/chapters.ts)`,
  );
  for (const entry of entries) {
    relatedEntryCount += 1;
    assert(
      knownSlugs.has(entry.slug),
      `${relative(ROOT, relatedPath)}: ${ownerSlug} references unknown related-chapter slug "${entry.slug}"`,
    );
  }
}

if (failures.length) {
  console.error(`Widget-data check FAILED (${failures.length} issue${failures.length === 1 ? '' : 's'}):`);
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log(
  `Widget-data check passed: optimizer trajectories, Chinchilla allocation, and MoE parameter accounting are internally consistent; ` +
  `${dataModules.length} widget data module${dataModules.length === 1 ? '' : 's'} swept for NaN exports; ` +
  `${relatedEntryCount} related-chapter reference${relatedEntryCount === 1 ? '' : 's'} resolve to registered chapters.`
);
