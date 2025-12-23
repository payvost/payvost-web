"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
/**
 * Prisma Client Singleton for Webhook Service
 * Ensures only one instance of Prisma Client is created
 * This prevents connection pool exhaustion
 */
const client_1 = require("@prisma/client");
let prismaInstance;
const NODE_ENV = process.env.NODE_ENV || 'production';
if (NODE_ENV === 'production') {
    prismaInstance = new client_1.PrismaClient({
        log: ['error'],
    });
}
else {
    if (!global.prisma) {
        global.prisma = new client_1.PrismaClient({
            log: ['query', 'error', 'warn'],
        });
    }
    prismaInstance = global.prisma;
}
exports.prisma = prismaInstance;
exports.default = exports.prisma;
