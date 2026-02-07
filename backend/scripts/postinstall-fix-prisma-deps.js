/* eslint-disable no-console */
/**
 * Some upstream packages occasionally publish missing ESM entrypoints (dist/index.mjs)
 * while still declaring them in package.json exports. Prisma CLI loads these via ESM.
 *
 * This script patches missing ESM entrypoints in node_modules so `prisma generate`
 * and other tooling can run reliably in CI.
 */

const fs = require('fs');
const path = require('path');

function ensureFile(filePath, contents) {
  if (fs.existsSync(filePath)) return false;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, 'utf8');
  return true;
}

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function fixDeepmergeTs(root) {
  const distDir = path.join(root, 'node_modules', 'deepmerge-ts', 'dist');
  const cjs = path.join(distDir, 'index.cjs');
  const mjs = path.join(distDir, 'index.mjs');

  if (!exists(cjs) || exists(mjs)) return false;

  const contents = `import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const mod = require('./index.cjs');

export const deepmerge = mod.deepmerge;
export const deepmergeCustom = mod.deepmergeCustom;
export const deepmergeInto = mod.deepmergeInto;
export const deepmergeIntoCustom = mod.deepmergeIntoCustom;
export const getKeys = mod.getKeys;
export const getObjectType = mod.getObjectType;
export const objectHasProperty = mod.objectHasProperty;
export default mod;
`;

  return ensureFile(mjs, contents);
}

function main() {
  const root = path.resolve(__dirname, '..');
  const changed = [];

  if (fixDeepmergeTs(root)) changed.push('deepmerge-ts/dist/index.mjs');

  if (changed.length) {
    console.log(`[postinstall] Patched missing ESM entrypoints: ${changed.join(', ')}`);
  }
}

main();

