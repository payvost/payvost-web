/**
 * Helper script to prepare Firebase Service Account JSON for environment variable
 * 
 * Usage:
 *   node scripts/prepare-firebase-env.js
 * 
 * This will output the JSON in a format suitable for FIREBASE_SERVICE_ACCOUNT_KEY
 */

const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'backend', 'payvost-web-firebase-adminsdk-fbsvc-f14c86f5d6.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account file not found at:', serviceAccountPath);
  process.exit(1);
}

try {
  const fileContent = fs.readFileSync(serviceAccountPath, 'utf8');
  const serviceAccount = JSON.parse(fileContent);
  
  // Convert to single-line JSON string (newlines in private_key will be \n)
  const jsonString = JSON.stringify(serviceAccount);
  
  console.log('\n✅ Firebase Service Account JSON prepared for environment variable\n');
  console.log('='.repeat(80));
  console.log('Add this to your .env file or Vercel environment variables:');
  console.log('='.repeat(80));
  console.log('\nFIREBASE_SERVICE_ACCOUNT_KEY=' + jsonString);
  console.log('\n' + '='.repeat(80));
  console.log('\n📝 Notes:');
  console.log('  - Copy the entire line above (including FIREBASE_SERVICE_ACCOUNT_KEY=)');
  console.log('  - For Vercel: Go to Settings → Environment Variables');
  console.log('  - Paste the entire value (the JSON string)');
  console.log('  - The private_key newlines (\\n) will be automatically handled\n');
  
  // Also create a .env.example entry
  const envExample = `FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"payvost-web",...}`;
  console.log('Example format:');
  console.log(envExample);
  console.log('\n');
  
} catch (error) {
  console.error('❌ Error processing service account file:', error.message);
  process.exit(1);
}

