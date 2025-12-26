/**
 * Prisma Client Singleton for Backend
 * Ensures only one instance of Prisma Client is created across the backend
 * This prevents connection pool exhaustion
 */
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
prismaInstance.$connect().catch((error: unknown) => {
  console.error('Prisma connection error:', error);
  // Don't throw - let Prisma handle reconnection automatically
});

// Handle disconnection gracefully
process.on('beforeExit', async () => {
  await prismaInstance.$disconnect();
});

export const prisma = prismaInstance;
export default prisma;
