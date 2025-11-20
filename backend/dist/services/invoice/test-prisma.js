"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function test() {
    try {
        const keys = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'));
        console.log('Prisma client keys:', keys);
        console.log('Has invoice?', 'invoice' in prisma);
        console.log('Has Invoice?', 'Invoice' in prisma);
        // Try lowercase
        if ('invoice' in prisma) {
            const count = await prisma.invoice.count();
            console.log('Invoice count (lowercase):', count);
        }
        // Try accessing via bracket notation
        const invoiceModel = prisma['invoice'];
        if (invoiceModel) {
            console.log('Found invoice model via bracket notation');
            const count = await invoiceModel.count();
            console.log('Invoice count:', count);
        }
        else {
            console.log('ERROR: Invoice model not found in Prisma client');
            console.log('Available models:', keys);
        }
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
test();
