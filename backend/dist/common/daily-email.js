"use strict";
/**
 * Daily Email Service for FX Rate Summaries
 * Sends daily rate summary emails at 7 AM based on user's timezone
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processDailyEmails = processDailyEmails;
const client_1 = require("@prisma/client");
const mailgun_1 = require("./mailgun");
const axios_1 = __importDefault(require("axios"));
const prisma = new client_1.PrismaClient();
// Country to timezone mapping (common countries)
const COUNTRY_TIMEZONE_MAP = {
    'US': 'America/New_York',
    'GB': 'Europe/London',
    'NG': 'Africa/Lagos',
    'GH': 'Africa/Accra',
    'KE': 'Africa/Nairobi',
    'ZA': 'Africa/Johannesburg',
    'JP': 'Asia/Tokyo',
    'CA': 'America/Toronto',
    'AU': 'Australia/Sydney',
    'CH': 'Europe/Zurich',
    'CN': 'Asia/Shanghai',
    'IN': 'Asia/Kolkata',
    'FR': 'Europe/Paris',
    'DE': 'Europe/Berlin',
    'IT': 'Europe/Rome',
    'ES': 'Europe/Madrid',
    'BR': 'America/Sao_Paulo',
    'MX': 'America/Mexico_City',
    'AR': 'America/Argentina/Buenos_Aires',
    'EG': 'Africa/Cairo',
    'TZ': 'Africa/Dar_es_Salaam',
    'UG': 'Africa/Kampala',
    'RW': 'Africa/Kigali',
};
/**
 * Get timezone for a country code
 */
function getTimezoneForCountry(countryCode) {
    if (!countryCode)
        return 'UTC';
    const upperCode = countryCode.toUpperCase();
    return COUNTRY_TIMEZONE_MAP[upperCode] || 'UTC';
}
/**
 * Check if current time is 7 AM in given timezone
 */
function is7AMInTimezone(timezone) {
    try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: '2-digit',
            hour12: false,
        });
        const hour = parseInt(formatter.format(now));
        return hour === 7;
    }
    catch (error) {
        console.error(`[Daily Email] Error checking timezone ${timezone}:`, error);
        return false;
    }
}
/**
 * Generate HTML email template for daily rate summary
 */
function generateDailyRateEmailHTML(params) {
    const { userName, rates, date } = params;
    const greeting = userName ? `Hello ${userName},` : 'Hello,';
    const rateRows = rates.map(rate => {
        const trendIcon = rate.trend === 'up' ? '📈' : rate.trend === 'down' ? '📉' : '➡️';
        const trendColor = rate.trend === 'up' ? '#10b981' : rate.trend === 'down' ? '#ef4444' : '#6b7280';
        const changeSign = rate.change24h >= 0 ? '+' : '';
        return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 4px;">${rate.pair}</div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          <div style="font-size: 18px; font-weight: 700; color: #111827;">${rate.rate.toFixed(4)}</div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          <div style="font-size: 14px; color: ${trendColor}; font-weight: 600;">
            ${trendIcon} ${changeSign}${rate.change24h.toFixed(2)}%
          </div>
        </td>
      </tr>
    `;
    }).join('');
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily FX Rate Summary - Payvost</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 30px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">📊 Daily FX Rate Summary</h1>
              <p style="margin: 10px 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">${date}</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                ${greeting}
              </p>
              
              <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 1.6;">
                Here's your daily summary of foreign exchange rates. Stay informed about the latest market movements.
              </p>
              
              <!-- Rates Table -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin: 0 0 30px;">
                <thead>
                  <tr style="background-color: #f8f9fa;">
                    <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Currency Pair</th>
                    <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Rate</th>
                    <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">24h Change</th>
                  </tr>
                </thead>
                <tbody>
                  ${rateRows}
                </tbody>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center" style="padding: 0;">
                    <a href="https://payvost.com/fx-rates" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">View All Rates</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                You're receiving this daily summary because you have active rate alerts. To manage your alerts, visit your FX Rates page.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 12px;">
                This is an automated daily summary from Payvost.
              </p>
              <p style="margin: 0; color: #999999; font-size: 11px;">
                © ${new Date().getFullYear()} Payvost. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
/**
 * Fetch current FX rates
 */
async function fetchRates(base = 'USD') {
    const OXR_APP_ID = process.env.OPEN_EXCHANGE_RATES_APP_ID;
    if (!OXR_APP_ID) {
        throw new Error('OPEN_EXCHANGE_RATES_APP_ID not configured');
    }
    const url = `https://openexchangerates.org/api/latest.json?app_id=${OXR_APP_ID}&base=${base}`;
    const response = await axios_1.default.get(url);
    return response.data.rates;
}
/**
 * Get popular currency pairs for daily summary
 */
function getPopularPairs() {
    return ['EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'];
}
/**
 * Send daily rate summary email to a user
 */
async function sendDailyRateEmail(user) {
    try {
        if (!(0, mailgun_1.isMailgunConfigured)()) {
            console.warn('[Daily Email] Mailgun not configured, skipping email');
            return false;
        }
        // Fetch current rates
        const rates = await fetchRates('USD');
        // Get popular pairs
        const popularPairs = getPopularPairs();
        // Build rate summary
        const rateSummary = popularPairs.map(code => {
            const rate = rates[code];
            if (!rate)
                return null;
            // Calculate 24h change (simplified - in production, you'd compare with yesterday's rate)
            const change24h = (Math.random() * 2 - 1) * 0.5; // Placeholder - replace with actual calculation
            const trend = change24h > 0.1 ? 'up' : change24h < -0.1 ? 'down' : 'neutral';
            return {
                pair: `USD/${code}`,
                rate: rate,
                change24h: change24h,
                trend: trend,
            };
        }).filter(Boolean);
        // Format date
        const date = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        // Generate rates table HTML for Mailgun template
        const ratesTableRows = rateSummary.map(rate => {
            const trendIcon = rate.trend === 'up' ? '📈' : rate.trend === 'down' ? '📉' : '➡️';
            const trendColor = rate.trend === 'up' ? '#10b981' : rate.trend === 'down' ? '#ef4444' : '#6b7280';
            const changeSign = rate.change24h >= 0 ? '+' : '';
            return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <div style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 4px;">${rate.pair}</div>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            <div style="font-size: 18px; font-weight: 700; color: #111827;">${rate.rate.toFixed(4)}</div>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            <div style="font-size: 14px; color: ${trendColor}; font-weight: 600;">
              ${trendIcon} ${changeSign}${rate.change24h.toFixed(2)}%
            </div>
          </td>
        </tr>
      `;
        }).join('');
        // Send email using Mailgun template
        const result = await (0, mailgun_1.sendEmail)({
            to: user.email,
            subject: `📊 Daily FX Rate Summary - ${date}`,
            template: 'daily-rate-summary', // Mailgun template name
            variables: {
                userName: user.name || '',
                date: date,
                rates: ratesTableRows, // Pre-generated HTML table rows
            },
            from: `Payvost Daily Summary <alerts@${process.env.MAILGUN_DOMAIN || 'payvost.com'}>`,
            tags: ['daily-rate-summary'],
        });
        if (result.success) {
            console.log(`[Daily Email] Sent daily summary to ${user.email}`);
            return true;
        }
        else {
            console.error(`[Daily Email] Failed to send to ${user.email}:`, result.error);
            return false;
        }
    }
    catch (error) {
        console.error(`[Daily Email] Error sending to ${user.email}:`, error.message);
        return false;
    }
}
/**
 * Process daily emails for all users
 * This should be called by a cron job every hour
 */
async function processDailyEmails() {
    console.log('[Daily Email] Starting daily email processing...');
    try {
        // Get all users with email addresses
        const users = await prisma.user.findMany({
            where: {
                email: { not: '' },
            },
            select: {
                id: true,
                email: true,
                name: true,
                country: true,
            },
        });
        if (!users.length) {
            console.log('[Daily Email] No users found');
            return { processed: 0, sent: 0, errors: 0 };
        }
        console.log(`[Daily Email] Found ${users.length} users`);
        let sent = 0;
        let errors = 0;
        // Process each user
        for (const user of users) {
            if (!user.email)
                continue;
            try {
                // Get user's timezone
                const timezone = getTimezoneForCountry(user.country);
                // Check if it's 7 AM in user's timezone
                if (is7AMInTimezone(timezone)) {
                    const success = await sendDailyRateEmail({
                        email: user.email,
                        name: user.name,
                        country: user.country,
                    });
                    if (success) {
                        sent++;
                    }
                    else {
                        errors++;
                    }
                }
            }
            catch (error) {
                console.error(`[Daily Email] Error processing user ${user.id}:`, error.message);
                errors++;
            }
        }
        console.log(`[Daily Email] Processing complete: ${sent} sent, ${errors} errors`);
        return { processed: users.length, sent, errors };
    }
    catch (error) {
        console.error('[Daily Email] Processing error:', error);
        throw error;
    }
}
