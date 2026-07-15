#!/usr/bin/env node
// Guards active Codex orchestration surfaces. Historical prompts and textbook
// content intentionally remain outside this check because they may discuss
// providers as part of the curriculum.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const failures = [];
const legacyRuntimeCommand = /(?:^|[\s"'[(;|&=:])claude(?=$|[\s"'[\]),;|&])/im;

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function checkNoLegacyRuntime(filePath) {
  const text = readFileSync(filePath, 'utf8');
  if (legacyRuntimeCommand.test(text)) {
    failures.push(`${relative(ROOT, filePath)}: active workflow invokes a legacy runtime command`);
  }
}

const detectionFixtures = new Map([
  ['claude --resume', true],
  ['"runtimeExecutable": "claude"', true],
  ['["claude", "--flag"]', true],
  ['claude; npm run build', true],
  ['codex exec --full-auto', false],
  ['myclaude-wrapper', false],
]);

for (const [sample, expected] of detectionFixtures) {
  if (legacyRuntimeCommand.test(sample) !== expected) {
    failures.push(`legacy command detector regression for fixture: ${sample}`);
  }
}

const legacyConfigDir = join(ROOT, '.claude');
if (existsSync(legacyConfigDir) && readdirSync(legacyConfigDir).length > 0) {
  failures.push('.claude: obsolete active runtime configuration remains in the repository');
}

const activeFiles = [
  join(ROOT, 'AGENTS.md'),
  join(ROOT, 'package.json'),
  join(ROOT, 'docs', 'CODEX_WORKFLOW.md'),
  ...walk(join(ROOT, '.codex')),
  ...walk(join(ROOT, '.github', 'workflows')),
  ...walk(join(ROOT, 'scripts')).filter((file) => !file.endsWith('check-active-workflow.mjs')),
].filter(existsSync);

for (const filePath of activeFiles) checkNoLegacyRuntime(filePath);

const rootConfig = join(ROOT, '.codex', 'config.toml');
if (!existsSync(rootConfig)) {
  failures.push('.codex/config.toml: missing project Codex configuration');
} else {
  const config = readFileSync(rootConfig, 'utf8');
  if (!/model\s*=\s*"gpt-5\.6-terra"/.test(config)) {
    failures.push('.codex/config.toml: project default must be gpt-5.6-terra');
  }
  if (!/model_reasoning_effort\s*=\s*"high"/.test(config)) {
    failures.push('.codex/config.toml: project default reasoning effort must be high');
  }
}

const agentDir = join(ROOT, '.codex', 'agents');
const expectedAgents = new Map([
  ['researcher.toml', 'gpt-5.6-terra'],
  ['content-worker.toml', 'gpt-5.6-terra'],
  ['widget-worker.toml', 'gpt-5.6-terra'],
  ['verifier.toml', 'gpt-5.6-terra'],
  ['reviewer.toml', 'gpt-5.6-sol'],
  ['synthesizer.toml', 'gpt-5.6-sol'],
]);

for (const [name, model] of expectedAgents) {
  const filePath = join(agentDir, name);
  if (!existsSync(filePath)) {
    failures.push(`.codex/agents/${name}: missing required project agent`);
    continue;
  }
  const text = readFileSync(filePath, 'utf8');
  if (!text.includes(`model = "${model}"`)) {
    failures.push(`.codex/agents/${name}: expected ${model}`);
  }
  if (!text.includes('model_reasoning_effort = "high"')) {
    failures.push(`.codex/agents/${name}: reasoning effort must be high`);
  }
}

if (failures.length) {
  console.error(`Active workflow check FAILED (${failures.length} issue${failures.length === 1 ? '' : 's'}):`);
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log('Active workflow check passed: Codex project configuration, agents, and runtime boundaries are intact.');
