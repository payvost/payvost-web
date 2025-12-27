"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initTwilio = initTwilio;
exports.sendSMS = sendSMS;
exports.sendVerificationCode = sendVerificationCode;
exports.sendTransactionSMS = sendTransactionSMS;
exports.isTwilioConfigured = isTwilioConfigured;
const twilio_1 = __importDefault(require("twilio"));
const logger_1 = require("../../common/logger");
let twilioClient = null;
let twilioConfigured = false;
/**
 * Initialize Twilio client
 */
function initTwilio() {
    // Trim whitespace from environment variables
    const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER?.trim();
    // Check if credentials are missing or empty
    if (!accountSid || !authToken || !phoneNumber) {
        logger_1.logger.warn('Twilio credentials not configured. SMS notifications will be disabled.');
        return;
    }
    // Validate Account SID format (must start with "AC")
    if (!accountSid.startsWith('AC')) {
        logger_1.logger.warn(`Invalid Twilio Account SID format. Account SID must start with "AC". SMS notifications will be disabled.`);
        return;
    }
    try {
        twilioClient = (0, twilio_1.default)(accountSid, authToken);
        twilioConfigured = true;
        logger_1.logger.info('Twilio client initialized successfully');
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Failed to initialize Twilio client');
        twilioConfigured = false;
    }
}
/**
 * Send SMS via Twilio
 */
async function sendSMS(to, message, options) {
    if (!twilioConfigured || !twilioClient) {
        logger_1.logger.warn('Twilio not configured. SMS will not be sent.');
        return { success: false, error: 'SMS service not configured' };
    }
    const from = options?.from || process.env.TWILIO_PHONE_NUMBER;
    if (!from) {
        logger_1.logger.error('Twilio phone number not configured');
        return { success: false, error: 'Twilio phone number not configured' };
    }
    try {
        // Validate phone number format (should include country code)
        const normalizedTo = to.startsWith('+') ? to : `+${to}`;
        const twilioMessage = await twilioClient.messages.create({
            body: message,
            from: from,
            to: normalizedTo,
        });
        logger_1.logger.info({
            messageSid: twilioMessage.sid,
            to: normalizedTo,
            status: twilioMessage.status,
        }, 'SMS sent successfully');
        return {
            success: true,
            messageId: twilioMessage.sid,
        };
    }
    catch (error) {
        logger_1.logger.error({
            err: error,
            to,
            errorCode: error.code,
            errorMessage: error.message,
        }, 'Failed to send SMS');
        // Handle specific Twilio errors
        if (error.code === 21211) {
            return { success: false, error: 'Invalid phone number format' };
        }
        if (error.code === 21608) {
            return { success: false, error: 'Unverified phone number (trial account)' };
        }
        if (error.code === 21614) {
            return { success: false, error: 'Unsubscribed recipient' };
        }
        return {
            success: false,
            error: error.message || 'Failed to send SMS',
        };
    }
}
/**
 * Send verification code via SMS
 */
async function sendVerificationCode(phoneNumber, code) {
    const message = `Your Payvost verification code is: ${code}. This code will expire in 10 minutes.`;
    return sendSMS(phoneNumber, message);
}
/**
 * Send transaction notification via SMS
 */
async function sendTransactionSMS(phoneNumber, details) {
    let message;
    if (details.type === 'sent') {
        message = `You sent ${details.currency} ${details.amount} to ${details.recipient || 'recipient'}. Thank you for using Payvost!`;
    }
    else {
        message = `You received ${details.currency} ${details.amount} from ${details.sender || 'sender'}. Thank you for using Payvost!`;
    }
    return sendSMS(phoneNumber, message);
}
/**
 * Check if Twilio is configured
 */
function isTwilioConfigured() {
    return twilioConfigured;
}
