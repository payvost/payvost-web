const { execSync } = require('child_process');
const path = require('path');

// Compile common/mailgun.ts from the email service directory
// This ensures module resolution works correctly
const emailServiceDir = __dirname + '/..';
const commonFile = path.resolve(emailServiceDir, '../../common/mailgun.ts');
const outDir = path.resolve(emailServiceDir, '../../common');

try {
  // Change to email service directory so node_modules resolution works
  process.chdir(emailServiceDir);
  
  // Compile the common file
  execSync(
    `npx tsc "${commonFile}" --outDir "${outDir}" --module commonjs --target ES2020 --esModuleInterop --skipLibCheck --resolveJsonModule --moduleResolution node`,
    { stdio: 'inherit', cwd: emailServiceDir }
  );
  
  console.log('[Build] Common mailgun.ts compiled successfully');
} catch (error) {
  console.error('[Build] Failed to compile common/mailgun.ts:', error.message);
  process.exit(1);
}

