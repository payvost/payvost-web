const { execSync } = require('child_process');
const path = require('path');

// Compile common files from the rate-alert-service directory
// This ensures module resolution works correctly
const serviceDir = __dirname + '/..';
const commonDir = path.resolve(serviceDir, '../../common');

const commonFiles = [
  'mailgun.ts',
  'daily-email.ts'
];

try {
  // Change to service directory so node_modules resolution works
  process.chdir(serviceDir);
  
  // Compile each common file
  for (const file of commonFiles) {
    const commonFile = path.resolve(commonDir, file);
    console.log(`[Build] Compiling ${file}...`);
    
    execSync(
      `npx tsc "${commonFile}" --outDir "${commonDir}" --module commonjs --target ES2020 --esModuleInterop --skipLibCheck --resolveJsonModule --moduleResolution node`,
      { stdio: 'inherit', cwd: serviceDir }
    );
  }
  
  console.log('[Build] Common files compiled successfully');
} catch (error) {
  console.error('[Build] Failed to compile common files:', error.message);
  process.exit(1);
}

