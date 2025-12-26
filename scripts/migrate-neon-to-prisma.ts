import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
const rootEnvPath = path.resolve(__dirname, '..', '.env');
const backendEnvPath = path.resolve(__dirname, '..', 'backend', '.env');

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath, override: true });
}

// Source: Neon database
const neonUrl = process.env.NEON_DATABASE_URL || 
  'postgresql://neondb_owner:npg_DOkxXyE50Yft@ep-lingering-art-adc5d3rq.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

const neonPrisma = new PrismaClient({
  datasources: {
    db: {
      url: neonUrl,
    },
  },
});

// Target: Prisma Data Platform
const prismaUrl = process.env.DATABASE_URL;
if (!prismaUrl) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const prismaDataPlatform = new PrismaClient({
  datasources: {
    db: {
      url: prismaUrl,
    },
  },
});

interface TableInfo {
  name: string;
  dependencies: string[];
}

// Define migration order based on foreign key dependencies
const tables: TableInfo[] = [
  { name: 'User', dependencies: [] },
  { name: 'ReferralCode', dependencies: ['User'] },
  { name: 'Account', dependencies: ['User'] },
  { name: 'ReferralCampaign', dependencies: [] },
  { name: 'Referral', dependencies: ['User', 'ReferralCode'] },
  { name: 'ReferralReward', dependencies: ['Referral', 'User', 'Account'] },
  { name: 'FeeRule', dependencies: [] },
  { name: 'Transfer', dependencies: ['Account'] },
  { name: 'AppliedFee', dependencies: ['Transfer', 'Account'] },
  { name: 'AppliedRuleInstance', dependencies: ['AppliedFee', 'FeeRule'] },
  { name: 'LedgerEntry', dependencies: ['Account'] },
  { name: 'AccountActivity', dependencies: ['Account', 'User'] },
  { name: 'ExternalTransaction', dependencies: ['User'] },
  { name: 'Escrow', dependencies: ['Account'] },
  { name: 'EscrowParty', dependencies: ['Escrow'] },
  { name: 'Milestone', dependencies: ['Escrow'] },
  { name: 'EscrowTransaction', dependencies: ['Escrow', 'Milestone'] },
  { name: 'Dispute', dependencies: ['Escrow'] },
  { name: 'DisputeEvidence', dependencies: ['Dispute'] },
  { name: 'DisputeMessage', dependencies: ['Dispute'] },
  { name: 'EscrowActivity', dependencies: ['Escrow', 'Milestone'] },
  { name: 'EscrowDocument', dependencies: ['Escrow'] },
  { name: 'RateAlert', dependencies: [] },
  { name: 'ErrorLog', dependencies: [] },
  { name: 'ComplianceAlert', dependencies: [] },
  { name: 'Content', dependencies: ['User'] },
  { name: 'ContentVersion', dependencies: ['Content'] },
  { name: 'ContentComment', dependencies: ['Content'] },
  { name: 'ContentMedia', dependencies: ['Content'] },
  { name: 'SupportTicket', dependencies: ['User'] },
  { name: 'TicketMessage', dependencies: ['SupportTicket', 'User'] },
  { name: 'TicketAttachment', dependencies: ['SupportTicket', 'User'] },
  { name: 'KnowledgeBaseArticle', dependencies: ['User'] },
  { name: 'ChatSession', dependencies: ['User'] },
  { name: 'ChatMessage', dependencies: ['ChatSession'] },
  { name: 'ChatEvent', dependencies: ['ChatSession'] },
  { name: 'SavedReply', dependencies: [] },
  { name: 'ServiceHealthCheck', dependencies: [] },
  { name: 'SystemIncident', dependencies: [] },
  { name: 'Invoice', dependencies: ['User'] },
];

async function getTableCount(tableName: string, prisma: PrismaClient): Promise<number> {
  try {
    const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}"`);
    return Number((result as any[])[0]?.count || 0);
  } catch (error) {
    return 0;
  }
}

async function migrateTable(tableName: string, order: number, total: number) {
  console.log(`\n[${order}/${total}] Migrating ${tableName}...`);
  
  try {
    // Check if table exists and has data
    const neonCount = await getTableCount(tableName, neonPrisma);
    
    if (neonCount === 0) {
      console.log(`  ⚠️  No data in ${tableName}, skipping...`);
      return { migrated: 0, skipped: true };
    }

    console.log(`  📊 Found ${neonCount} records in Neon`);

    // Get all records from Neon
    const records = await neonPrisma.$queryRawUnsafe(`SELECT * FROM "${tableName}"`);
    
    if (!records || (records as any[]).length === 0) {
      console.log(`  ⚠️  No records returned, skipping...`);
      return { migrated: 0, skipped: true };
    }

    // Check current count in Prisma Data Platform
    const prismaCount = await getTableCount(tableName, prismaDataPlatform);
    console.log(`  📊 Current records in Prisma Data Platform: ${prismaCount}`);

    // Insert into Prisma Data Platform in batches
    const batchSize = 50; // Smaller batches for reliability
    const batches = [];
    for (let i = 0; i < (records as any[]).length; i += batchSize) {
      batches.push((records as any[]).slice(i, i + batchSize));
    }

    let inserted = 0;
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      try {
        // Build INSERT statement with proper escaping
        const columns = Object.keys(batch[0]);
        const columnNames = columns.map(c => `"${c}"`).join(', ');
        
        const values = batch.map(record => {
          const vals = columns.map(col => {
            const val = record[col];
            if (val === null || val === undefined) return 'NULL';
            
            // Handle arrays (text[], etc.)
            if (Array.isArray(val)) {
              if (val.length === 0) {
                // Empty array needs explicit type cast
                return `ARRAY[]::text[]`;
              }
              const arrayValues = val.map(item => {
                if (typeof item === 'string') {
                  return `'${item.replace(/'/g, "''")}'`;
                }
                return String(item);
              }).join(',');
              return `ARRAY[${arrayValues}]`;
            }
            
            // Handle Decimal types (from Prisma, they come as objects with toString method)
            if (val && typeof val === 'object' && 'toString' in val && typeof val.toString === 'function') {
              // Check if it's a Decimal-like object (Prisma Decimal type)
              const strVal = val.toString();
              // If it's a valid number string, use it directly
              if (!isNaN(parseFloat(strVal)) && isFinite(parseFloat(strVal))) {
                return strVal;
              }
            }
            
            // Handle strings
            if (typeof val === 'string') {
              // Escape single quotes and wrap in quotes
              return `'${val.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
            }
            
            // Handle dates
            if (val instanceof Date) {
              return `'${val.toISOString()}'`;
            }
            
            // Handle objects (JSON/JSONB fields) - but skip if it's already handled above
            if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
              // Check if it's a Date (already handled) or Decimal (already handled)
              if (!(val instanceof Date) && !('toString' in val && typeof val.toString === 'function')) {
                return `'${JSON.stringify(val).replace(/'/g, "''").replace(/\\/g, '\\\\')}'::jsonb`;
              }
            }
            
            // Handle booleans
            if (typeof val === 'boolean') {
              return val ? 'true' : 'false';
            }
            
            // Handle numbers (including Decimal/numeric types)
            if (typeof val === 'number') {
              return String(val);
            }
            
            // Handle BigInt
            if (typeof val === 'bigint') {
              return String(val);
            }
            
            // Default: convert to string
            return String(val);
          });
          return `(${vals.join(', ')})`;
        }).join(',\n    ');

        const insertSQL = `
          INSERT INTO "${tableName}" (${columnNames}) 
          VALUES ${values}
          ON CONFLICT DO NOTHING;
        `;
        
        await prismaDataPlatform.$executeRawUnsafe(insertSQL);
        inserted += batch.length;
        console.log(`  ✅ Batch ${i + 1}/${batches.length} (${batch.length} records)`);
      } catch (batchError: any) {
        console.error(`  ⚠️  Batch ${i + 1} failed: ${batchError.message}`);
        // Try individual inserts for this batch
        for (const record of batch) {
          try {
            const cols = Object.keys(record);
            const colNames = cols.map(c => `"${c}"`).join(', ');
            const vals = cols.map(col => {
              const val = record[col];
              if (val === null || val === undefined) return 'NULL';
              
              // Handle arrays
              if (Array.isArray(val)) {
                if (val.length === 0) {
                  return `ARRAY[]::text[]`;
                }
                const arrayValues = val.map(item => {
                  if (typeof item === 'string') {
                    return `'${item.replace(/'/g, "''")}'`;
                  }
                  return String(item);
                }).join(',');
                return `ARRAY[${arrayValues}]`;
              }
              
              // Handle Decimal types
              if (val && typeof val === 'object' && 'toString' in val && typeof val.toString === 'function') {
                const strVal = val.toString();
                if (!isNaN(parseFloat(strVal)) && isFinite(parseFloat(strVal))) {
                  return strVal;
                }
              }
              
              if (typeof val === 'string') return `'${String(val).replace(/'/g, "''")}'`;
              if (val instanceof Date) return `'${val.toISOString()}'`;
              if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                // Check if it's a Decimal-like object
                if ('toString' in val && typeof val.toString === 'function') {
                  const strVal = val.toString();
                  if (!isNaN(parseFloat(strVal)) && isFinite(parseFloat(strVal))) {
                    return strVal;
                  }
                }
                return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
              }
              if (typeof val === 'boolean') return val ? 'true' : 'false';
              if (typeof val === 'number' || typeof val === 'bigint') return String(val);
              return String(val);
            }).join(', ');
            
            await prismaDataPlatform.$executeRawUnsafe(
              `INSERT INTO "${tableName}" (${colNames}) VALUES (${vals}) ON CONFLICT DO NOTHING;`
            );
            inserted++;
          } catch (recordError: any) {
            console.error(`    ⚠️  Failed to insert record: ${recordError.message.substring(0, 100)}`);
          }
        }
      }
    }

    const finalCount = await getTableCount(tableName, prismaDataPlatform);
    console.log(`  ✅ ${tableName} migration complete! Migrated: ${inserted}, Total in target: ${finalCount}`);
    
    return { migrated: inserted, skipped: false };
  } catch (error: any) {
    console.error(`  ❌ Error migrating ${tableName}:`, error.message);
    return { migrated: 0, skipped: false, error: error.message };
  }
}

async function migrateData() {
  console.log('🚀 Starting data migration from Neon to Prisma Data Platform...\n');
  console.log(`Source (Neon): ${neonUrl.replace(/:[^:@]+@/, ':****@')}`);
  console.log(`Target (Prisma): ${prismaUrl.replace(/:[^:@]+@/, ':****@')}\n`);

  const results: Array<{ table: string; migrated: number; skipped: boolean; error?: string }> = [];

  try {
    // Test connections
    console.log('🔌 Testing connections...');
    await neonPrisma.$queryRaw`SELECT 1`;
    console.log('  ✅ Neon connection OK');
    
    await prismaDataPlatform.$queryRaw`SELECT 1`;
    console.log('  ✅ Prisma Data Platform connection OK\n');

    // Migrate tables in order
    for (let i = 0; i < tables.length; i++) {
      const result = await migrateTable(tables[i].name, i + 1, tables.length);
      results.push({ table: tables[i].name, ...result });
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.migrated > 0);
    const skipped = results.filter(r => r.skipped);
    const failed = results.filter(r => r.error);

    console.log(`\n✅ Successfully migrated: ${successful.length} tables`);
    successful.forEach(r => {
      console.log(`   - ${r.table}: ${r.migrated} records`);
    });

    if (skipped.length > 0) {
      console.log(`\n⚠️  Skipped (empty): ${skipped.length} tables`);
      skipped.forEach(r => {
        console.log(`   - ${r.table}`);
      });
    }

    if (failed.length > 0) {
      console.log(`\n❌ Failed: ${failed.length} tables`);
      failed.forEach(r => {
        console.log(`   - ${r.table}: ${r.error}`);
      });
    }

    console.log('\n✅ Data migration completed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Verify data in Prisma Studio: npm run db:studio');
    console.log('   2. Test your application with the new database');
    console.log('   3. Once verified, you can decommission the old Neon database');

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await neonPrisma.$disconnect();
    await prismaDataPlatform.$disconnect();
  }
}

// Run migration
migrateData()
  .then(() => {
    console.log('\n🎉 Migration process finished!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });

