const fs = require('fs');
const path = require('path');

const distIndex = path.join(__dirname, '..', 'dist', 'index.js');
const backendCommonMailgun = path.join(__dirname, '..', '..', '..', 'common', 'mailgun.js');

if (!fs.existsSync(distIndex)) {
  console.error('[Build Verification] ERROR: dist/index.js not found after compilation');
  console.error('[Build Verification] Expected location:', distIndex);
  
  // List what's in dist if it exists
  const distDir = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(distDir)) {
    console.error('[Build Verification] Contents of dist directory:');
    try {
      const files = fs.readdirSync(distDir);
      files.forEach(file => {
        const filePath = path.join(distDir, file);
        const stat = fs.statSync(filePath);
        console.error(`  ${file} (${stat.isDirectory() ? 'directory' : 'file'})`);
      });
    } catch (err) {
      console.error('  (could not read directory)');
    }
  } else {
    console.error('[Build Verification] dist directory does not exist');
  }
  
  process.exit(1);
}

if (!fs.existsSync(backendCommonMailgun)) {
  console.error('[Build Verification] ERROR: backend/common/mailgun.js not found after compilation');
  console.error('[Build Verification] Expected location:', backendCommonMailgun);
  process.exit(1);
}

console.log('[Build Verification] ✓ dist/index.js exists');
console.log('[Build Verification] ✓ backend/common/mailgun.js exists');

