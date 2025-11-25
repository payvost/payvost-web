const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Compile common/mailgun.ts from the email service directory
// This ensures module resolution works correctly
const emailServiceDir = __dirname + '/..';
const commonFile = path.resolve(emailServiceDir, '../../common/mailgun.ts');
const commonOutDir = path.resolve(emailServiceDir, '../../common');
const distDir = path.resolve(emailServiceDir, 'dist');
const distCommonDir = path.resolve(distDir, 'common');

try {
  // Change to email service directory so node_modules resolution works
  process.chdir(emailServiceDir);
  
  // Compile the common file to the common directory first
  execSync(
    `npx tsc "${commonFile}" --outDir "${commonOutDir}" --module commonjs --target ES2020 --esModuleInterop --skipLibCheck --resolveJsonModule --moduleResolution node`,
    { stdio: 'inherit', cwd: emailServiceDir }
  );
  
  // Also compile to dist/common so it can access node_modules from the service directory
  // Create dist/common directory if it doesn't exist
  if (!fs.existsSync(distCommonDir)) {
    fs.mkdirSync(distCommonDir, { recursive: true });
  }
  
  execSync(
    `npx tsc "${commonFile}" --outDir "${distCommonDir}" --module commonjs --target ES2020 --esModuleInterop --skipLibCheck --resolveJsonModule --moduleResolution node`,
    { stdio: 'inherit', cwd: emailServiceDir }
  );
  
  console.log('[Build] Common mailgun.ts compiled successfully');
} catch (error) {
  console.error('[Build] Failed to compile common/mailgun.ts:', error.message);
  process.exit(1);
}

