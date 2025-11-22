/**
 * Copy Prisma Client from backend root to webhook service node_modules
 * This ensures the Prisma client is available in the webhook service's node_modules
 */

const fs = require('fs');
const path = require('path');

// Get paths relative to the script location
// Script is at: backend/services/webhooks/scripts/copy-prisma-client.js
// Prisma generates to: ../../node_modules/.prisma/client (relative to schema)
// From schema (backend/prisma/schema.prisma): ../../ goes to project root
// So source should be at: project-root/node_modules/.prisma/client
// Target should be at: backend/services/webhooks/node_modules/.prisma/client
const targetDir = path.resolve(__dirname, '../node_modules/.prisma/client');

// Try multiple possible source locations (project root or backend root)
const possibleSources = [
  path.resolve(__dirname, '../../../../node_modules/.prisma/client'), // project root
  path.resolve(__dirname, '../../../node_modules/.prisma/client'), // backend root
  path.resolve(process.cwd(), 'node_modules/.prisma/client'), // cwd root
];

// Ensure target directory exists
if (!fs.existsSync(path.dirname(targetDir))) {
  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
}

// Find the source directory (try multiple possible locations)
let actualSourceDir = null;

for (const src of possibleSources) {
  if (fs.existsSync(src)) {
    actualSourceDir = src;
    console.log(`[Prisma Copy] Found source at: ${actualSourceDir}`);
    break;
  }
}

if (!actualSourceDir) {
  console.error(`[Prisma Copy] Source directory not found. Tried:`);
  possibleSources.forEach(src => console.error(`  - ${src}`));
  console.error('[Prisma Copy] Please run "prisma generate" first');
  console.error(`[Prisma Copy] Current working directory: ${process.cwd()}`);
  console.error(`[Prisma Copy] Script location: ${__dirname}`);
  process.exit(1);
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
  console.log(`[Prisma Copy] Copying Prisma Client from ${actualSourceDir} to ${targetDir}`);
  
  // Ensure target parent directory exists
  const targetParent = path.dirname(targetDir);
  if (!fs.existsSync(targetParent)) {
    fs.mkdirSync(targetParent, { recursive: true });
  }
  
  // Remove target if it exists
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  
  // Copy source to target
  copyRecursiveSync(actualSourceDir, targetDir);
  
  // Verify copy was successful
  if (!fs.existsSync(path.join(targetDir, 'index.js'))) {
    throw new Error('Copy verification failed: index.js not found in target');
  }
  
  console.log('[Prisma Copy] Prisma Client copied successfully');
  console.log(`[Prisma Copy] Target location: ${targetDir}`);
} catch (error) {
  console.error('[Prisma Copy] Error copying Prisma Client:', error.message);
  console.error(error.stack);
  process.exit(1);
}

