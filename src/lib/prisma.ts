/**
 * Prisma Client Singleton
 * Ensures only one instance of Prisma Client is created across the application
 * 
 * Connection pool settings should be configured in DATABASE_URL:
 * - Add ?connection_limit=10&pool_timeout=20 to increase pool size
 * - Example: postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20
 */
// @ts-ignore - Prisma client types
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let prismaInstance: PrismaClient;

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error', 'warn'],
    errorFormat: 'pretty',
  });
}

if (process.env.NODE_ENV === 'production') {
  prismaInstance = createPrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = createPrismaClient();
  }
  prismaInstance = global.prisma;
}

// Add connection error handling
prismaInstance.$connect().catch((error) => {
  console.error('Prisma connection error:', error);
  // Don't throw - let Prisma handle reconnection automatically
});

// Handle disconnection gracefully
process.on('beforeExit', async () => {
  await prismaInstance.$disconnect();
});

export const prisma = prismaInstance;
