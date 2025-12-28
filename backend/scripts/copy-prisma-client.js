/**
 * Copy Prisma Client to backend's node_modules
 * Ensures Prisma Client is available at runtime
 */

const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(__dirname, '../node_modules/.prisma/client');

// Try multiple possible source locations
const possibleSources = [
  path.resolve(__dirname, '../../node_modules/.prisma/client'), // project root (if backend is in a subfolder)
  path.resolve(__dirname, '../../../node_modules/.prisma/client'), // alternative project root
  path.resolve(process.cwd(), '../node_modules/.prisma/client'), // parent of cwd
];

// Ensure target directory exists
if (!fs.existsSync(path.dirname(targetDir))) {
  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
}

// Find the source directory
let actualSourceDir = null;

for (const src of possibleSources) {
  if (fs.existsSync(src)) {
    actualSourceDir = src;
    console.log(`[Prisma Copy] Found source at: ${actualSourceDir}`);
    break;
  }
}

if (!actualSourceDir) {
  console.warn(`[Prisma Copy] Source directory not found, will generate fresh.`);
  console.warn(`[Prisma Copy] Tried locations:`);
  possibleSources.forEach(src => console.warn(`  - ${src}`));
  process.exit(0); // Don't fail, let prisma generate handle it
}

// Copy directory recursively
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  console.log(`[Prisma Copy] Copying Prisma Client to ${targetDir}`);

  const targetParent = path.dirname(targetDir);
  if (!fs.existsSync(targetParent)) {
    fs.mkdirSync(targetParent, { recursive: true });
  }

  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }

  copyRecursiveSync(actualSourceDir, targetDir);

  if (!fs.existsSync(path.join(targetDir, 'index.js'))) {
    throw new Error('Copy verification failed: index.js not found');
  }

  console.log('[Prisma Copy] Prisma Client copied successfully');
} catch (error) {
  console.error('[Prisma Copy] Error copying:', error.message);
  process.exit(0); // Don't fail build, let prisma generate handle it
}

