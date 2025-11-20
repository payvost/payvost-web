#!/usr/bin/env node

/**
 * Neon Database Connection Test
 * Tests connection with detailed diagnostics
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('🔍 Neon Database Connection Diagnostics\n');
  console.log('=' .repeat(60));
  
  // Check environment variables
  console.log('\n1. Environment Variables Check:');
  const dbUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;
  
  if (!dbUrl) {
    console.error('   ❌ DATABASE_URL not found in environment');
    console.log('   💡 Make sure backend/.env exists and contains DATABASE_URL');
    return;
  } else {
    console.log('   ✅ DATABASE_URL is set');
    // Mask password in output
    const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
    console.log(`   📝 Connection: ${maskedUrl}`);
  }
  
  if (!directUrl) {
    console.log('   ⚠️  DIRECT_URL not set (optional for migrations)');
  } else {
    console.log('   ✅ DIRECT_URL is set');
  }
  
  // Test connection with different configurations
  console.log('\n2. Testing Connection Methods:\n');
  
  // Method 1: Direct connection test
  console.log('   Method 1: Direct Prisma Client connection...');
  try {
    const prisma1 = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
      log: ['error'],
    });
    
    await prisma1.$connect();
    console.log('   ✅ Connection successful!');
    
    // Test query
    const result = await prisma1.$queryRaw`SELECT version() as version, current_database() as database`;
    console.log(`   📊 Database: ${result[0].database}`);
    console.log(`   📊 Version: ${result[0].version.split(' ')[0]} ${result[0].version.split(' ')[1]}`);
    
    await prisma1.$disconnect();
    console.log('   ✅ Disconnected successfully\n');
    
    // Method 2: Test with DIRECT_URL for migrations
    if (directUrl) {
      console.log('   Method 2: Testing DIRECT_URL (for migrations)...');
      try {
        const prisma2 = new PrismaClient({
          datasources: {
            db: {
              url: directUrl,
            },
          },
          log: ['error'],
        });
        
        await prisma2.$connect();
        console.log('   ✅ DIRECT_URL connection successful!');
        await prisma2.$disconnect();
      } catch (err) {
        console.log(`   ⚠️  DIRECT_URL connection failed: ${err.message}`);
      }
    }
    
    // Check existing tables
    console.log('\n3. Checking Database Schema:');
    const prisma3 = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });
    
    await prisma3.$connect();
    
    const tables = await prisma3.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    if (tables.length === 0) {
      console.log('   ⚠️  No tables found. Database is empty.');
      console.log('   💡 Run migrations: npm run db:migrate');
    } else {
      console.log(`   ✅ Found ${tables.length} tables:`);
      tables.slice(0, 10).forEach((table) => {
        console.log(`      - ${table.table_name}`);
      });
      if (tables.length > 10) {
        console.log(`      ... and ${tables.length - 10} more`);
      }
    }
    
    await prisma3.$disconnect();
    
    console.log('\n✨ Connection test completed successfully!');
    console.log('\nNext steps:');
    console.log('  - Run migrations: npm run db:migrate');
    console.log('  - Open Prisma Studio: npm run db:studio');
    
  } catch (error) {
    console.error('\n❌ Connection failed!\n');
    console.error('Error details:');
    console.error(`  Message: ${error.message}`);
    console.error(`  Code: ${error.code || 'N/A'}`);
    
    console.error('\n🔧 Troubleshooting steps:');
    console.error('  1. Verify database is active in Neon dashboard');
    console.error('  2. Check if your IP is whitelisted (Neon allows all by default)');
    console.error('  3. Verify connection string format');
    console.error('  4. Check network/firewall settings');
    console.error('  5. Try connecting from Neon SQL Editor to verify database is accessible');
    console.error('  6. Ensure SSL mode is set correctly (?sslmode=require)');
    
    if (error.message.includes("Can't reach database server")) {
      console.error('\n💡 Network Issue Detected:');
      console.error('  - This usually means the database server is not reachable');
      console.error('  - Check if you need VPN or if Neon database is paused');
      console.error('  - Neon databases auto-pause after inactivity (free tier)');
      console.error('  - Wake up the database from Neon dashboard if paused');
    }
    
    if (error.message.includes('authentication')) {
      console.error('\n💡 Authentication Issue:');
      console.error('  - Verify username and password in connection string');
      console.error('  - Check if credentials are correct in Neon dashboard');
    }
    
    process.exit(1);
  }
}

testConnection();

