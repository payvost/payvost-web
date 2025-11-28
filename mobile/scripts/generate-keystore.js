#!/usr/bin/env node

/**
 * Generate Android Keystore for EAS Build
 * 
 * This script generates a keystore file for signing Android apps.
 * Run with: node scripts/generate-keystore.js
 * 
 * The generated keystore will be saved as payvost-release.jks
 * IMPORTANT: Save the passwords securely - you'll need them for EAS!
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function generateKeystore() {
  console.log('🔐 Android Keystore Generator for EAS Build\n');
  console.log('This will generate a keystore file for signing your Android app.\n');

  // Get inputs
  const keystorePassword = await question('Enter keystore password (min 6 chars): ');
  if (keystorePassword.length < 6) {
    console.error('❌ Password must be at least 6 characters');
    process.exit(1);
  }

  const keyAlias = await question('Enter key alias (default: upload): ') || 'upload';
  const keyPassword = await question('Enter key password (press Enter to use same as keystore): ') || keystorePassword;

  const keystorePath = path.join(__dirname, '..', 'payvost-release.jks');
  
  // Check if keystore already exists
  if (fs.existsSync(keystorePath)) {
    const overwrite = await question(`⚠️  Keystore already exists at ${keystorePath}. Overwrite? (y/N): `);
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Cancelled.');
      process.exit(0);
    }
  }

  // Get package name from app.json
  let packageName = 'com.payvost.payvost';
  try {
    const appJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'app.json'), 'utf8'));
    packageName = appJson.expo?.android?.package || packageName;
  } catch (e) {
    console.warn('Could not read app.json, using default package name');
  }

  console.log('\n📦 Generating keystore...');
  console.log(`   Package: ${packageName}`);
  console.log(`   Alias: ${keyAlias}`);
  console.log(`   File: ${keystorePath}\n`);

  // Generate keystore using keytool
  // Build command with proper quoting for Windows compatibility
  const dname = `CN=${packageName}, OU=Mobile, O=Payvost, L=Unknown, ST=Unknown, C=US`;
  
  const keytoolArgs = [
    '-genkeypair',
    '-v',
    '-storetype', 'PKCS12',
    '-keystore', keystorePath,
    '-alias', keyAlias,
    '-keyalg', 'RSA',
    '-keysize', '2048',
    '-validity', '10000',
    '-storepass', keystorePassword,
    '-keypass', keyPassword,
    '-dname', dname
  ];

  try {
    // Use spawn instead of execSync for better Windows compatibility
    await new Promise((resolve, reject) => {
      const keytool = spawn('keytool', keytoolArgs, {
        stdio: 'inherit',
        shell: process.platform === 'win32'
      });
      
      keytool.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`keytool exited with code ${code}`));
          return;
        }
        
        // Verify the file was actually created
        if (!fs.existsSync(keystorePath)) {
          reject(new Error('Keystore file was not created. The keytool command may have failed.'));
          return;
        }
        
        console.log('\n✅ Keystore generated successfully!\n');
        console.log('📋 IMPORTANT - Save these credentials securely:\n');
        console.log(`   Keystore File: ${keystorePath}`);
        console.log(`   Keystore Password: ${keystorePassword}`);
        console.log(`   Key Alias: ${keyAlias}`);
        console.log(`   Key Password: ${keyPassword}\n`);
        console.log('⚠️  This file is already in .gitignore and will NOT be committed to git.\n');
        console.log('📤 Next steps:');
        console.log('   1. Upload the keystore file to EAS');
        console.log('   2. Enter the passwords when prompted in EAS dashboard\n');
        resolve();
      });
      
      keytool.on('error', (err) => {
        reject(new Error(`Failed to start keytool: ${err.message}`));
      });
    });
  } catch (error) {
    console.error('\n❌ Error generating keystore:', error.message);
    if (fs.existsSync(keystorePath)) {
      // Clean up partial file if it exists
      try {
        fs.unlinkSync(keystorePath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

generateKeystore();

