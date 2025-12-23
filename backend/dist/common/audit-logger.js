"use strict";
/**
 * Comprehensive Audit Logger for Financial Operations
 * Logs all financial transactions, account changes, and sensitive operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditSeverity = exports.AuditAction = void 0;
exports.createAuditLog = createAuditLog;
exports.logFinancialTransaction = logFinancialTransaction;
exports.logBalanceChange = logBalanceChange;
exports.logSecurityEvent = logSecurityEvent;
exports.logAdminAction = logAdminAction;
exports.queryAuditLogs = queryAuditLogs;
const client_1 = require("@prisma/client");
const logger_1 = require("./logger");
const prisma = new client_1.PrismaClient();
var AuditAction;
(function (AuditAction) {
    // Account operations
    AuditAction["ACCOUNT_CREATED"] = "ACCOUNT_CREATED";
    AuditAction["ACCOUNT_UPDATED"] = "ACCOUNT_UPDATED";
    AuditAction["ACCOUNT_DELETED"] = "ACCOUNT_DELETED";
    // Transaction operations
    AuditAction["TRANSFER_INITIATED"] = "TRANSFER_INITIATED";
    AuditAction["TRANSFER_COMPLETED"] = "TRANSFER_COMPLETED";
    AuditAction["TRANSFER_FAILED"] = "TRANSFER_FAILED";
    AuditAction["TRANSFER_CANCELLED"] = "TRANSFER_CANCELLED";
    // Balance operations
    AuditAction["BALANCE_DEPOSITED"] = "BALANCE_DEPOSITED";
    AuditAction["BALANCE_WITHDRAWN"] = "BALANCE_WITHDRAWN";
    AuditAction["BALANCE_ADJUSTED"] = "BALANCE_ADJUSTED";
    // Payment operations
    AuditAction["PAYMENT_INTENT_CREATED"] = "PAYMENT_INTENT_CREATED";
    AuditAction["PAYMENT_COMPLETED"] = "PAYMENT_COMPLETED";
    AuditAction["PAYMENT_FAILED"] = "PAYMENT_FAILED";
    AuditAction["PAYMENT_REFUNDED"] = "PAYMENT_REFUNDED";
    // KYC/AML operations
    AuditAction["KYC_SUBMITTED"] = "KYC_SUBMITTED";
    AuditAction["KYC_APPROVED"] = "KYC_APPROVED";
    AuditAction["KYC_REJECTED"] = "KYC_REJECTED";
    AuditAction["AML_CHECK_PERFORMED"] = "AML_CHECK_PERFORMED";
    AuditAction["AML_ALERT_CREATED"] = "AML_ALERT_CREATED";
    // User operations
    AuditAction["USER_CREATED"] = "USER_CREATED";
    AuditAction["USER_UPDATED"] = "USER_UPDATED";
    AuditAction["USER_DELETED"] = "USER_DELETED";
    AuditAction["PASSWORD_CHANGED"] = "PASSWORD_CHANGED";
    AuditAction["TWO_FACTOR_ENABLED"] = "TWO_FACTOR_ENABLED";
    AuditAction["TWO_FACTOR_DISABLED"] = "TWO_FACTOR_DISABLED";
    // Admin operations
    AuditAction["ADMIN_ACTION"] = "ADMIN_ACTION";
    AuditAction["SETTINGS_CHANGED"] = "SETTINGS_CHANGED";
    // Security operations
    AuditAction["LOGIN_SUCCESS"] = "LOGIN_SUCCESS";
    AuditAction["LOGIN_FAILED"] = "LOGIN_FAILED";
    AuditAction["LOGOUT"] = "LOGOUT";
    AuditAction["SESSION_EXPIRED"] = "SESSION_EXPIRED";
    AuditAction["SUSPICIOUS_ACTIVITY"] = "SUSPICIOUS_ACTIVITY";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
var AuditSeverity;
(function (AuditSeverity) {
    AuditSeverity["LOW"] = "LOW";
    AuditSeverity["MEDIUM"] = "MEDIUM";
    AuditSeverity["HIGH"] = "HIGH";
    AuditSeverity["CRITICAL"] = "CRITICAL";
})(AuditSeverity || (exports.AuditSeverity = AuditSeverity = {}));
/**
 * Create audit log entry
 * Uses AccountActivity table for now, but should be migrated to dedicated AuditLog table
 */
async function createAuditLog(entry) {
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
        logger_1.logger[logLevel]({
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
    }
    catch (error) {
        // Don't throw - audit logging failure shouldn't block operations
        logger_1.logger.error({ err: error, entry }, 'Failed to create audit log');
    }
}
/**
 * Log financial transaction
 */
async function logFinancialTransaction(action, transactionId, accountId, userId, amount, currency, description, context) {
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
async function logBalanceChange(action, accountId, userId, amount, currency, balanceBefore, balanceAfter, context) {
    await createAuditLog({
        action,
        severity: AuditSeverity.HIGH,
        userId,
        accountId,
        description: `Balance changed: ${balanceBefore} → ${balanceAfter} ${currency} (${parseFloat(amount) > 0 ? '+' : ''}${amount})`,
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
async function logSecurityEvent(action, userId, description, severity, context) {
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
async function logAdminAction(adminUserId, action, targetUserId, targetAccountId, metadata) {
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
async function queryAuditLogs(filters) {
    const { userId, accountId, startDate, endDate, limit = 100, offset = 0 } = filters;
    const where = {};
    if (userId) {
        where.userId = userId;
    }
    if (accountId) {
        where.accountId = accountId;
    }
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate)
            where.createdAt.gte = startDate;
        if (endDate)
            where.createdAt.lte = endDate;
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
