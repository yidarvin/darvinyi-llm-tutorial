import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const outputDir = resolve(process.cwd(), 'dist');

await rm(outputDir, { recursive: true, force: true });
console.log('Removed previous build output.');
