/**
 * Test Prisma Data Platform Connection
 * This script tests the database connection with timeout parameters
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const rootEnvPath = path.resolve(__dirname, '..', '.env');
const backendEnvPath = path.resolve(__dirname, '..', 'backend', '.env');

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath, override: true });
}

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  console.log('Testing Prisma Data Platform connection...');
  console.log('\n=== Environment Variables ===');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  if (process.env.DATABASE_URL) {
    const dbUrl = process.env.DATABASE_URL;
    // Extract hostname safely
    const match = dbUrl.match(/@([^:]+):(\d+)\//);
    if (match) {
      console.log('  Host:', match[1]);
      console.log('  Port:', match[2]);
    } else {
      console.log('  URL:', dbUrl.substring(0, 50) + '...');
    }
  }
  console.log('DIRECT_URL:', process.env.DIRECT_URL ? 'Set' : 'Not set');
  if (process.env.DIRECT_URL) {
    const directUrl = process.env.DIRECT_URL;
    const match = directUrl.match(/@([^:]+):(\d+)\//);
    if (match) {
      console.log('  Host:', match[1]);
      console.log('  Port:', match[2]);
    }
  }
  console.log('============================\n');

  try {
    console.log('\nAttempting to connect...');
    const result = await prisma.$queryRaw`SELECT version() as version, current_database() as database`;
    console.log('✅ Connection successful!');
    console.log('Database:', result[0]?.database);
    console.log('PostgreSQL Version:', result[0]?.version);
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`\n✅ Query test successful! User count: ${userCount}`);
    
  } catch (error) {
    console.error('\n❌ Connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.message.includes('Can\'t reach database server')) {
      console.error('\nPossible issues:');
      console.error('1. Database might be idle/paused - check Prisma Data Platform dashboard');
      console.error('2. Network/firewall blocking port 5432');
      console.error('3. Connection string format might be incorrect');
      console.error('4. Database might need activation');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

