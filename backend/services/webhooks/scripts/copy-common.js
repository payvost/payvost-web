/**
 * Copy common logger file to the location where the import expects it
 * The import '../../../common/logger' from dist/index.js resolves to backend/common/logger.js
 * So we need to ensure the logger is available at that location
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const serviceDir = path.resolve(__dirname, '..');
const commonLoggerSource = path.resolve(serviceDir, '../../common/logger.ts');
const backendCommonDir = path.resolve(serviceDir, '../../common');

try {
  // Change to service directory so node_modules resolution works
  process.chdir(serviceDir);
  
  // Compile the common logger file to backend/common (where the import expects it)
  console.log(`[Build] Compiling common/logger.ts...`);
  
  // Compile logger.ts to backend/common/logger.js
  execSync(
    `npx tsc "${commonLoggerSource}" --outDir "${backendCommonDir}" --module commonjs --target ES2020 --esModuleInterop --skipLibCheck --resolveJsonModule --moduleResolution node --rootDir "${backendCommonDir}"`,
    { stdio: 'inherit', cwd: serviceDir }
  );
  
  console.log('[Build] Common logger compiled successfully');
  console.log(`[Build] Output location: ${path.join(backendCommonDir, 'logger.js')}`);
} catch (error) {
  console.error('[Build] Failed to compile common/logger.ts:', error.message);
  // Don't exit - the common directory might already be compiled by the main build
  console.warn('[Build] Continuing build - logger may already be compiled');
}

