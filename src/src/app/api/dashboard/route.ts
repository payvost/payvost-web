
import { NextResponse } from 'next/server';

const currencyBalances = [
  { currency: 'USD', balance: '$1,250.75', growth: '+20.1% from last month', flag: 'us' },
  { currency: 'EUR', balance: '€2,500.50', growth: '+15.5% from last month', flag: 'eu' },
  { currency: 'GBP', balance: '£850.00', growth: '+5.2% from last month', flag: 'gb' },
  { currency: 'NGN', balance: '₦1,850,000.00', growth: '+30.8% from last month', flag: 'ng' },
  { currency: 'JPY', balance: '¥150,000', growth: '-2.1% from last month', flag: 'jp' },
];

export async function GET() {
  // In a real application, you would fetch this data from a database
  // and handle user authentication.
  return NextResponse.json({ currencyBalances });
}
