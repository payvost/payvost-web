/**
 * Prisma Client Singleton for Notification Processor Service
 * Ensures only one instance of Prisma Client is created
 * This prevents connection pool exhaustion
 */
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let prismaInstance: PrismaClient;

const NODE_ENV = process.env.NODE_ENV || 'production';

if (NODE_ENV === 'production') {
  prismaInstance = new PrismaClient({
    log: ['error'],
  });
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prismaInstance = global.prisma;
}

export const prisma = prismaInstance;
export default prisma;
