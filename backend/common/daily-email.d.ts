/**
 * Daily Email Service for FX Rate Summaries
 * Sends daily rate summary emails at 7 AM based on user's timezone
 */
/**
 * Process daily emails for all users
 * This should be called by a cron job every hour
 */
export declare function processDailyEmails(): Promise<{
    processed: number;
    sent: number;
    errors: number;
}>;
//# sourceMappingURL=daily-email.d.ts.map