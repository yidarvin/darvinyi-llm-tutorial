#!/usr/bin/env node
// Execute every reader-runnable Python block in the same Pyodide version that
// powers RunnableCode in the browser. This catches syntax, package, and runtime
// failures before they reach a reader. PyTorch references are deliberately
// marked runnable={false} in MDX and are reported separately as static code.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { loadPyodide } from 'pyodide';

const ROOT = process.cwd();
const PAGES_DIR = join(ROOT, 'src', 'pages');
const PYODIDE_DIR = join(ROOT, 'node_modules', 'pyodide');
const failures = [];
const filter = process.env.RUNNABLE_FILTER;

function isEscaped(text, index) {
  let slashCount = 0;
  for (let i = index - 1; i >= 0 && text[i] === '\\'; i -= 1) slashCount += 1;
  return slashCount % 2 === 1;
}

function decodeTemplateLiteral(text) {
  let output = '';
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== '\\') {
      output += text[i];
      continue;
    }

    const next = text[++i];
    if (next === undefined) throw new Error('template literal ends with a backslash');
    const simpleEscapes = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v', 0: '\0' };
    if (next in simpleEscapes) {
      output += simpleEscapes[next];
    } else if (next === 'x') {
      const hex = text.slice(i + 1, i + 3);
      if (!/^[0-9a-f]{2}$/i.test(hex)) throw new Error(`invalid \\x escape: ${hex}`);
      output += String.fromCharCode(parseInt(hex, 16));
      i += 2;
    } else if (next === 'u') {
      if (text[i + 1] === '{') {
        const end = text.indexOf('}', i + 2);
        const hex = text.slice(i + 2, end);
        if (end === -1 || !/^[0-9a-f]+$/i.test(hex)) throw new Error(`invalid \\u escape: ${hex}`);
        output += String.fromCodePoint(parseInt(hex, 16));
        i = end;
      } else {
        const hex = text.slice(i + 1, i + 5);
        if (!/^[0-9a-f]{4}$/i.test(hex)) throw new Error(`invalid \\u escape: ${hex}`);
        output += String.fromCharCode(parseInt(hex, 16));
        i += 4;
      }
    } else {
      // Backtick, dollar, backslash, and escaped punctuation all become the
      // literal following character in JavaScript template literals.
      output += next;
    }
  }
  return output;
}

function lineNumber(text, index) {
  return text.slice(0, index).split('\n').length;
}

function packagesFrom(attributes) {
  const match = attributes.match(/packages=\{\[([^\]]*)\]\}/);
  if (!match) return ['numpy'];
  return [...match[1].matchAll(/["']([^"']+)["']/g)].map((entry) => entry[1]);
}

function extractBlocks(filePath) {
  const text = readFileSync(filePath, 'utf8');
  const blocks = [];
  let cursor = 0;

  while (true) {
    const start = text.indexOf('<RunnableCode', cursor);
    if (start === -1) break;

    const templateStart = text.indexOf('defaultCode={`', start);
    const openingTagEnd = text.indexOf('>', start);
    if (openingTagEnd === -1) throw new Error('unterminated RunnableCode opening tag');

    let attributes;
    let code;
    let end;
    if (templateStart !== -1 && templateStart < openingTagEnd) {
      let templateEnd = -1;
      for (let i = templateStart + 'defaultCode={`'.length; i < text.length; i += 1) {
        if (text[i] === '`' && !isEscaped(text, i) && text[i + 1] === '}') {
          templateEnd = i;
          break;
        }
      }
      if (templateEnd === -1) throw new Error('unterminated defaultCode template literal');
      end = text.indexOf('/>', templateEnd);
      if (end === -1) throw new Error('unterminated self-closing RunnableCode tag');
      end += 2;
      attributes = text.slice(start, end);
      code = decodeTemplateLiteral(text.slice(templateStart + 'defaultCode={`'.length, templateEnd));
    } else {
      const close = text.indexOf('</RunnableCode>', openingTagEnd);
      if (close === -1) throw new Error('unterminated RunnableCode child block');
      end = close + '</RunnableCode>'.length;
      attributes = text.slice(start, openingTagEnd + 1);
      const body = text.slice(openingTagEnd + 1, close);
      const fenced = body.match(/```python[^\n]*\n([\s\S]*?)\n```/);
      if (!fenced) throw new Error('RunnableCode child block has no fenced Python source');
      code = fenced[1];
    }

    blocks.push({
      code,
      filePath,
      line: lineNumber(text, start),
      packages: packagesFrom(attributes),
      runnable: !/runnable=\{false\}/.test(attributes),
    });
    cursor = end;
  }
  return blocks;
}

function chapterFiles() {
  return readdirSync(PAGES_DIR)
    .filter((name) => /^ch\d{2}-/.test(name))
    .sort()
    .map((name) => join(PAGES_DIR, name, 'index.mdx'))
    .filter(existsSync);
}

const blocks = chapterFiles().flatMap(extractBlocks).map((block, index) => ({
  ...block,
  id: `runnable-${String(index + 1).padStart(3, '0')}`,
}));
const runnableBlocks = blocks.filter((block) => block.runnable);
const staticBlocks = blocks.filter((block) => !block.runnable);
const selectedBlocks = filter
  ? runnableBlocks.filter((block) => `${relative(ROOT, block.filePath)}:${block.line}`.includes(filter))
  : runnableBlocks;
const starterBlocks = selectedBlocks.filter((block) => /\bTODO\b/.test(block.code));
const executableBlocks = selectedBlocks.filter((block) => !/\bTODO\b/.test(block.code));

if (blocks.length !== 237) {
  failures.push(`expected to extract 237 RunnableCode blocks, found ${blocks.length}; update this guard only after reviewing the new block`);
}

for (const block of runnableBlocks) {
  const executableLines = block.code
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('#'))
    .join('\n');
  if (/\b(?:import|from)\s+torch\b/.test(executableLines)) {
    failures.push(`${relative(ROOT, block.filePath)}:${block.line}: PyTorch code must be marked runnable={false} or rewritten for Pyodide`);
  }
}

if (!existsSync(PYODIDE_DIR)) {
  failures.push('node_modules/pyodide is missing; run npm install before checking runnable code');
}

if (filter && selectedBlocks.length === 0) {
  failures.push(`RUNNABLE_FILTER=${filter} did not match a runnable block`);
}

if (!failures.length) {
  const pyodide = await loadPyodide({ indexURL: './node_modules/pyodide/' });
  const loadedPackages = new Set();

  for (const block of starterBlocks) {
    try {
      await pyodide.runPythonAsync(`compile(${JSON.stringify(block.code)}, ${JSON.stringify(block.id)}, 'exec')`);
    } catch (error) {
      const message = String(error?.message ?? error).split('\n');
      failures.push(`${relative(ROOT, block.filePath)}:${block.line}: starter exercise does not compile\n${message.slice(-8).join('\n')}`);
    }
  }

  for (const block of executableBlocks) {
    try {
      const packages = block.packages.filter((pkg) => !loadedPackages.has(pkg));
      if (packages.length) {
        await pyodide.loadPackage(packages);
        packages.forEach((pkg) => loadedPackages.add(pkg));
      }

      const output = [];
      pyodide.setStdout({ batched: (text) => output.push(text) });
      pyodide.setStderr({ batched: (text) => output.push(text) });
      const source = [
        "namespace = {'__name__': '__main__'}",
        `exec(compile(${JSON.stringify(block.code)}, ${JSON.stringify(block.id)}, 'exec'), namespace, namespace)`,
      ].join('\n');
      await pyodide.runPythonAsync(source);
    } catch (error) {
      const message = String(error?.message ?? error).split('\n');
      failures.push(`${relative(ROOT, block.filePath)}:${block.line}: ${message.slice(-8).join('\n')}`);
    }
  }
}

if (failures.length) {
  console.error(`Runnable-code check FAILED (${failures.length} issue${failures.length === 1 ? '' : 's'}):`);
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log(`Runnable-code check passed: ${executableBlocks.length}${filter ? ` filtered of ${runnableBlocks.length}` : ''} Pyodide demos executed; ${starterBlocks.length} starter exercise block${starterBlocks.length === 1 ? '' : 's'} compiled; ${staticBlocks.length} static reference block${staticBlocks.length === 1 ? '' : 's'} excluded.`);
