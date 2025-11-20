"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendRateAlertEmail = sendRateAlertEmail;
const form_data_1 = __importDefault(require("form-data"));
const mailgun_js_1 = __importDefault(require("mailgun.js"));
const apiKey = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_DOMAIN;
if (!apiKey || !domain) {
    throw new Error('Mailgun API key or domain not set in environment variables');
}
const mailgun = new mailgun_js_1.default(form_data_1.default);
const mg = mailgun.client({ username: 'api', key: apiKey, url: 'https://api.mailgun.net' });
async function sendRateAlertEmail(to, subject, text) {
    await mg.messages.create(domain, {
        from: `alerts@${domain}`,
        to: [to],
        subject,
        text,
    });
}
