const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testing Prisma connection...\n');

    // Test 1: Check User count
    const userCount = await prisma.user.count();
    console.log(`✅ Users in database: ${userCount}`);

    // Test 2: Check Account count
    const accountCount = await prisma.account.count();
    console.log(`✅ Accounts in database: ${accountCount}`);

    // Test 3: Check Transfer count
    const transferCount = await prisma.transfer.count();
    console.log(`✅ Transfers in database: ${transferCount}`);

    // Test 4: Get one user sample
    const sampleUser = await prisma.user.findFirst({
      select: {
        id: true,
        email: true,
        createdAt: true,
      }
    });
    if (sampleUser) {
      console.log(`\n✅ Sample user found:`, sampleUser);
    } else {
      console.log(`\n⚠️  No users found in database`);
    }

    console.log('\n🎉 Prisma connection is working correctly!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
