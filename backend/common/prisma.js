"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
/**
 * Prisma Client Singleton for Backend
 * Ensures only one instance of Prisma Client is created across the backend
 * This prevents connection pool exhaustion
 */
const client_1 = require("@prisma/client");
let prismaInstance;
function createPrismaClient() {
    return new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error', 'warn'],
        errorFormat: 'pretty',
    });
}
if (process.env.NODE_ENV === 'production') {
    prismaInstance = createPrismaClient();
}
else {
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
exports.prisma = prismaInstance;
exports.default = exports.prisma;
//# sourceMappingURL=prisma.js.map