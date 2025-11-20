/**
 * Prisma Client Singleton
 * Ensures only one instance of Prisma Client is created across the application
 */
// @ts-ignore - Prisma client types
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let prismaInstance: PrismaClient;

if (process.env.NODE_ENV === 'production') {
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
