#!/usr/bin/env node

/**
 * Database Connection Test Script
 * 
 * This script verifies that your Prisma database connection is working correctly.
 * Run this after setting up your .env.development.local file.
 * 
 * Usage: node scripts/test-db-connection.js
 */

const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('🔍 Testing database connection...\n');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  try {
    // Test basic connection
    console.log('1. Checking database connection...');
    await prisma.$connect();
    console.log('   ✅ Database connection successful!\n');

    // Test query execution
    console.log('2. Testing query execution...');
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('   ✅ Query execution successful!');
    console.log(`   📊 Database version: ${result[0].version}\n`);

    // Check if tables exist
    console.log('3. Checking database tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    if (tables.length === 0) {
      console.log('   ⚠️  No tables found. You may need to run migrations.');
      console.log('   Run: npx prisma migrate deploy\n');
    } else {
      console.log(`   ✅ Found ${tables.length} tables:`);
      tables.forEach((table) => {
        console.log(`      - ${table.table_name}`);
      });
      console.log('');
    }

    // Test if User table exists (main table)
    console.log('4. Checking Prisma models...');
    try {
      const userCount = await prisma.user.count();
      console.log(`   ✅ User table accessible (${userCount} users)\n`);
    } catch (error) {
      console.log('   ⚠️  User table not found or not accessible.');
      console.log('   You may need to run migrations first.');
      console.log('   Run: npx prisma migrate deploy\n');
    }

    console.log('✨ Database connection test completed successfully!\n');
    console.log('Next steps:');
    console.log('  - Run migrations: npx prisma migrate deploy');
    console.log('  - Start development: npm run dev');
    console.log('  - Open Prisma Studio: npx prisma studio\n');

  } catch (error) {
    console.error('\n❌ Database connection test failed!\n');
    console.error('Error details:', error.message);
    console.error('\nCommon issues:');
    console.error('  1. DATABASE_URL not set in .env.development.local');
    console.error('  2. Database credentials are incorrect');
    console.error('  3. Database server is not accessible');
    console.error('  4. SSL/TLS connection issue (ensure ?sslmode=require is in URL)');
    console.error('\nCheck your .env.development.local file and try again.\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
