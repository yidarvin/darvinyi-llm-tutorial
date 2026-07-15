#!/usr/bin/env node
// Regression checks for numeric claims rendered by high-risk widget data.
// These modules are TypeScript-only data/math modules with no runtime imports;
// transpiling them here keeps the assertions close to the values readers see.

import { readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

const ROOT = process.cwd();
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function loadDataModule(path) {
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
  vm.runInNewContext(output, context, { filename: path });
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

if (failures.length) {
  console.error(`Widget-data check FAILED (${failures.length} issue${failures.length === 1 ? '' : 's'}):`);
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log('Widget-data check passed: optimizer trajectories, Chinchilla allocation, and MoE parameter accounting are internally consistent.');
