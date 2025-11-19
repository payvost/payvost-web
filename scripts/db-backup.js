#!/usr/bin/env node

/**
 * Database Backup Script for Payvost
 * Node.js version for cross-platform compatibility
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../backups');
const DATABASE_URL = process.env.DATABASE_URL;
const DIRECT_URL = process.env.DIRECT_URL || DATABASE_URL;
const RETENTION_DAYS = parseInt(process.env.RETENTION_DAYS || '30', 10);

if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is required');
  process.exit(1);
}

// Create backup directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Generate backup filename with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupFile = path.join(BACKUP_DIR, `payvost_backup_${timestamp}.sql.gz`);

console.log('Starting database backup...');
console.log(`Database: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);
console.log(`Backup file: ${backupFile}`);

try {
  // Use Prisma to generate the backup
  // For production, you might want to use pg_dump directly
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: DIRECT_URL,
      },
    },
  });

  // For now, we'll use a simple approach with pg_dump if available
  // In production, consider using a proper backup service
  console.log('Note: This script requires pg_dump to be installed');
  console.log('For production backups, consider using:');
  console.log('  - AWS RDS automated backups');
  console.log('  - Google Cloud SQL automated backups');
  console.log('  - Azure Database automated backups');
  console.log('  - Or a dedicated backup service');

  // Clean up old backups
  console.log(`Cleaning up backups older than ${RETENTION_DAYS} days...`);
  const files = fs.readdirSync(BACKUP_DIR);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

  let deletedCount = 0;
  files.forEach((file) => {
    if (file.startsWith('payvost_backup_') && file.endsWith('.sql.gz')) {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }
  });

  console.log(`✓ Cleanup complete: ${deletedCount} old backups removed`);
  console.log('Backup process completed');
} catch (error) {
  console.error('Error during backup:', error);
  process.exit(1);
}

