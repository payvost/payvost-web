const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Compile common/mailgun.ts from the email service directory
// This ensures module resolution works correctly
const emailServiceDir = __dirname + '/..';
const commonFile = path.resolve(emailServiceDir, '../../common/mailgun.ts');
const distDir = path.resolve(emailServiceDir, 'dist');
const distCommonDir = path.resolve(distDir, 'common');

try {
  // Change to email service directory so node_modules resolution works
  process.chdir(emailServiceDir);
  
  // Create dist/common directory if it doesn't exist
  if (!fs.existsSync(distCommonDir)) {
    fs.mkdirSync(distCommonDir, { recursive: true });
  }
  
  // Compile the common file to dist/common so it can access node_modules from the service directory
  // From dist/index.js, ./common/mailgun resolves to dist/common/mailgun.js
  // This location allows mailgun.js to resolve form-data and mailgun.js from node_modules
  execSync(
    `npx tsc "${commonFile}" --outDir "${distCommonDir}" --module commonjs --target ES2020 --esModuleInterop --skipLibCheck --resolveJsonModule --moduleResolution node`,
    { stdio: 'inherit', cwd: emailServiceDir }
  );
  
  // Also copy to src/common for tsx watch development mode
  // tsx watch runs TypeScript directly and needs the file in src/common/
  const srcCommonDir = path.resolve(emailServiceDir, 'src', 'common');
  if (!fs.existsSync(srcCommonDir)) {
    fs.mkdirSync(srcCommonDir, { recursive: true });
  }
  const compiledFile = path.join(distCommonDir, 'mailgun.js');
  const srcCommonFile = path.join(srcCommonDir, 'mailgun.js');
  if (fs.existsSync(compiledFile)) {
    fs.copyFileSync(compiledFile, srcCommonFile);
    console.log('[Build] Copied mailgun.js to src/common for development');
  }
  
  console.log('[Build] Common mailgun.ts compiled successfully');
} catch (error) {
  console.error('[Build] Failed to compile common/mailgun.ts:', error.message);
  process.exit(1);
}

