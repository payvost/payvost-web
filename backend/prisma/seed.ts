import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
const rootEnvPath = path.resolve(__dirname, '../../.env');
const backendEnvPath = path.resolve(__dirname, '../../backend/.env');

console.log('Loading env from:', rootEnvPath);
if (fs.existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath });
}
if (fs.existsSync(backendEnvPath)) {
    dotenv.config({ path: backendEnvPath, override: true });
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
}

console.log('Connecting to database...');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: databaseUrl,
        },
    },
});

async function main() {
    console.log('🌱 Starting seeding...');

    // 1. Create a Test User
    const user = await prisma.user.upsert({
        where: { email: 'demo@payvost.com' },
        update: {},
        create: {
            id: 'demo-user-uid',
            email: 'demo@payvost.com',
            name: 'Demo User',
            role: 'user',
            kycStatus: 'verified',
            country: 'US',
            userTier: 'STANDARD',
            twoFactorEnabled: false,
            updatedAt: new Date(),
        },
    });
    console.log('✅ User seeded:', user.email);

    // 2. Create Accounts (USD and NGN) if not exist
    let usdAccount = await prisma.account.findFirst({
        where: { userId: user.id, currency: 'USD' }
    });

    if (!usdAccount) {
        usdAccount = await prisma.account.create({
            data: {
                userId: user.id,
                currency: 'USD',
                balance: 5000.00,
                type: 'PERSONAL',
                updatedAt: new Date(),
            },
        });
        console.log('✅ USD Account created');
    } else {
        console.log('ℹ️  USD Account already exists');
    }

    let ngnAccount = await prisma.account.findFirst({
        where: { userId: user.id, currency: 'NGN' }
    });

    if (!ngnAccount) {
        ngnAccount = await prisma.account.create({
            data: {
                userId: user.id,
                currency: 'NGN',
                balance: 250000.00,
                type: 'PERSONAL',
                updatedAt: new Date(),
            },
        });
        console.log('✅ NGN Account created');
    } else {
        console.log('ℹ️  NGN Account already exists');
    }

    // 3. Create some Invoices
    // We need dates
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    // Check if invoices exist
    const invoiceCount = await prisma.invoice.count({
        where: { userId: user.id }
    });

    if (invoiceCount === 0) {
        await prisma.invoice.create({
            data: {
                invoiceNumber: 'INV-001',
                invoiceType: 'USER',
                userId: user.id,
                createdBy: user.id,
                issueDate: today,
                dueDate: nextWeek,
                status: 'PENDING',
                currency: 'USD',
                grandTotal: 150.00,
                taxRate: 0,
                fromInfo: {
                    name: 'Demo User',
                    email: 'demo@payvost.com',
                    address: '123 Tech Lane'
                },
                toInfo: {
                    name: 'Client A',
                    email: 'client@example.com',
                    address: '456 Business Rd'
                },
                items: [
                    { description: 'Consulting Services', quantity: 10, price: 15.00 }
                ],
                paymentMethod: 'PAYVOST',
            }
        });
        console.log('✅ Pending Invoice seeded');

        await prisma.invoice.create({
            data: {
                invoiceNumber: 'INV-002',
                invoiceType: 'USER',
                userId: user.id,
                createdBy: user.id,
                issueDate: today,
                dueDate: nextWeek,
                status: 'PAID',
                currency: 'USD',
                grandTotal: 300.00,
                taxRate: 0,
                fromInfo: { name: 'Demo User', email: 'demo@payvost.com' },
                toInfo: { name: 'Client B', email: 'clientb@example.com' },
                items: [
                    { description: 'Web Development', quantity: 1, price: 300.00 }
                ],
                paymentMethod: 'PAYVOST',
                paidAt: new Date(),
            }
        });
        console.log('✅ Paid Invoice seeded');
    } else {
        console.log('ℹ️  Invoices already exist');
    }

    console.log('Seed completed successfully! 🌱');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
