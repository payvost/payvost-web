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
const commonLoggerDist = path.join(backendCommonDir, 'logger.js');

try {
  // Check if the common logger is already compiled
  if (fs.existsSync(commonLoggerDist)) {
    console.log('[Build] Common logger already compiled');
    console.log(`[Build] Using: ${commonLoggerDist}`);
  } else if (fs.existsSync(commonLoggerSource)) {
    // Try to compile the logger if source exists
    console.log('[Build] Compiling common/logger.ts...');
    try {
      // Try to use the local TypeScript installation
      execSync(
        `npx tsc "${commonLoggerSource}" --outDir "${backendCommonDir}" --module commonjs --target ES2020 --esModuleInterop --skipLibCheck --resolveJsonModule --moduleResolution node --rootDir "${backendCommonDir}"`,
        { stdio: 'inherit', cwd: serviceDir }
      );
      console.log('[Build] Common logger compiled successfully');
    } catch (error) {
      console.warn('[Build] Could not compile logger with local TypeScript, will try to use root installation');
      try {
        // Fallback: try using TypeScript from root node_modules
        execSync(
          `node ../../node_modules/.bin/tsc "${commonLoggerSource}" --outDir "${backendCommonDir}" --module commonjs --target ES2020 --esModuleInterop --skipLibCheck --resolveJsonModule --moduleResolution node --rootDir "${backendCommonDir}"`,
          { stdio: 'inherit', cwd: serviceDir }
        );
        console.log('[Build] Common logger compiled successfully from root');
      } catch (error2) {
        console.warn('[Build] Could not compile logger - it may be built separately');
      }
    }
  } else {
    console.warn('[Build] Common logger source not found at:', commonLoggerSource);
  }
} catch (error) {
  console.error('[Build] Error in build:common:', error.message);
}

