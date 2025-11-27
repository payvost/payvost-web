/**
 * Comprehensive Audit Logger for Financial Operations
 * Logs all financial transactions, account changes, and sensitive operations
 */

import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient();

export enum AuditAction {
  // Account operations
  ACCOUNT_CREATED = 'ACCOUNT_CREATED',
  ACCOUNT_UPDATED = 'ACCOUNT_UPDATED',
  ACCOUNT_DELETED = 'ACCOUNT_DELETED',
  
  // Transaction operations
  TRANSFER_INITIATED = 'TRANSFER_INITIATED',
  TRANSFER_COMPLETED = 'TRANSFER_COMPLETED',
  TRANSFER_FAILED = 'TRANSFER_FAILED',
  TRANSFER_CANCELLED = 'TRANSFER_CANCELLED',
  
  // Balance operations
  BALANCE_DEPOSITED = 'BALANCE_DEPOSITED',
  BALANCE_WITHDRAWN = 'BALANCE_WITHDRAWN',
  BALANCE_ADJUSTED = 'BALANCE_ADJUSTED',
  
  // Payment operations
  PAYMENT_INTENT_CREATED = 'PAYMENT_INTENT_CREATED',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_REFUNDED = 'PAYMENT_REFUNDED',
  
  // KYC/AML operations
  KYC_SUBMITTED = 'KYC_SUBMITTED',
  KYC_APPROVED = 'KYC_APPROVED',
  KYC_REJECTED = 'KYC_REJECTED',
  AML_CHECK_PERFORMED = 'AML_CHECK_PERFORMED',
  AML_ALERT_CREATED = 'AML_ALERT_CREATED',
  
  // User operations
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  TWO_FACTOR_ENABLED = 'TWO_FACTOR_ENABLED',
  TWO_FACTOR_DISABLED = 'TWO_FACTOR_DISABLED',
  
  // Admin operations
  ADMIN_ACTION = 'ADMIN_ACTION',
  SETTINGS_CHANGED = 'SETTINGS_CHANGED',
  
  // Security operations
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
}

export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AuditLogContext {
  userId?: string;
  accountId?: string;
  transactionId?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

export interface AuditLogEntry {
  action: AuditAction;
  severity: AuditSeverity;
  userId?: string;
  accountId?: string;
  transactionId?: string;
  description: string;
  context: AuditLogContext;
  metadata?: Record<string, any>;
}

/**
 * Create audit log entry
 * Uses AccountActivity table for now, but should be migrated to dedicated AuditLog table
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const { action, severity, userId, accountId, transactionId, description, context, metadata } = entry;
    
    // Log to AccountActivity table (temporary until AuditLog table is created)
    if (accountId && userId) {
      await prisma.accountActivity.create({
        data: {
          accountId,
          userId,
          action: `${action}: ${description}`,
          ipAddress: context.ipAddress,
          metadata: {
            ...metadata,
            severity,
            transactionId,
            correlationId: context.correlationId,
            deviceId: context.deviceId,
            userAgent: context.userAgent,
            timestamp: new Date().toISOString(),
          },
        },
      });
    }
    
    // Also log to console for immediate visibility
    const logLevel = severity === 'CRITICAL' ? 'error' : 
                     severity === 'HIGH' ? 'warn' : 
                     severity === 'MEDIUM' ? 'info' : 'debug';
    
    logger[logLevel]({
      audit: true,
      action,
      severity,
      userId,
      accountId,
      transactionId,
      description,
      ...context,
      ...metadata,
    }, `[AUDIT] ${action}: ${description}`);
    
  } catch (error) {
    // Don't throw - audit logging failure shouldn't block operations
    logger.error({ err: error, entry }, 'Failed to create audit log');
  }
}

/**
 * Log financial transaction
 */
export async function logFinancialTransaction(
  action: AuditAction,
  transactionId: string,
  accountId: string,
  userId: string,
  amount: string,
  currency: string,
  description: string,
  context: AuditLogContext
): Promise<void> {
  await createAuditLog({
    action,
    severity: AuditSeverity.HIGH,
    userId,
    accountId,
    transactionId,
    description: `${description} - ${amount} ${currency}`,
    context,
    metadata: {
      amount,
      currency,
      transactionType: action,
    },
  });
}

/**
 * Log account balance change
 */
export async function logBalanceChange(
  action: AuditAction,
  accountId: string,
  userId: string,
  amount: string,
  currency: string,
  balanceBefore: string,
  balanceAfter: string,
  context: AuditLogContext
): Promise<void> {
  await createAuditLog({
    action,
    severity: AuditSeverity.HIGH,
    userId,
    accountId,
    description: `Balance changed: ${balanceBefore} → ${balanceAfter} ${currency} (${amount > 0 ? '+' : ''}${amount})`,
    context,
    metadata: {
      amount,
      currency,
      balanceBefore,
      balanceAfter,
    },
  });
}

/**
 * Log security event
 */
export async function logSecurityEvent(
  action: AuditAction,
  userId: string,
  description: string,
  severity: AuditSeverity,
  context: AuditLogContext
): Promise<void> {
  await createAuditLog({
    action,
    severity,
    userId,
    description,
    context,
  });
}

/**
 * Log admin action
 */
export async function logAdminAction(
  adminUserId: string,
  action: string,
  targetUserId?: string,
  targetAccountId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    action: AuditAction.ADMIN_ACTION,
    severity: AuditSeverity.MEDIUM,
    userId: adminUserId,
    accountId: targetAccountId,
    description: `Admin action: ${action}`,
    context: {
      userId: adminUserId,
      metadata: {
        ...metadata,
        targetUserId,
        adminAction: action,
      },
    },
  });
}

/**
 * Query audit logs
 */
export async function queryAuditLogs(filters: {
  userId?: string;
  accountId?: string;
  action?: AuditAction;
  severity?: AuditSeverity;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const { userId, accountId, startDate, endDate, limit = 100, offset = 0 } = filters;
  
  const where: any = {};
  
  if (userId) {
    where.userId = userId;
  }
  
  if (accountId) {
    where.accountId = accountId;
  }
  
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }
  
  // Filter by action in metadata if needed
  // Note: This is a simplified query - in production, use a dedicated AuditLog table
  
  return await prisma.accountActivity.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
}

