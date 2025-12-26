import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    MAILGUN_API_KEY: process.env.MAILGUN_API_KEY ? '✅ SET' : '❌ MISSING',
    MAILGUN_DOMAIN: process.env.MAILGUN_DOMAIN ? '✅ SET' : '❌ MISSING',
    MAILGUN_FROM_EMAIL: process.env.MAILGUN_FROM_EMAIL || 'not-set',
    MAILGUN_SMTP_HOST: process.env.MAILGUN_SMTP_HOST || 'not-set',
    NODE_ENV: process.env.NODE_ENV,
    allMailgunVars: Object.entries(process.env)
      .filter(([k]) => k.includes('MAILGUN'))
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v ? '✅ SET' : '❌ MISSING' }), {}),
  });
}
