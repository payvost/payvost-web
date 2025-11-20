// Simple connection test
require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
const { PrismaClient } = require('@prisma/client');

async function test() {
  const prisma = new PrismaClient({ log: ['error'] });
  try {
    console.log('Connecting...');
    await prisma.$connect();
    console.log('✅ Connected!');
    const result = await prisma.$queryRaw`SELECT 1 as test, version() as version`;
    console.log('✅ Query successful:', result[0]);
    await prisma.$disconnect();
    console.log('✅ Disconnected');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes("Can't reach")) {
      console.error('\n💡 Database is likely PAUSED. Wake it up from Neon dashboard!');
    }
    process.exit(1);
  }
}

test();

