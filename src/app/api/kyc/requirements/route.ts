import { NextResponse } from 'next/server';
import { KYC_CONFIG } from '@/config/kyc';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');
  if (country) {
    const cfg = KYC_CONFIG.find(c => c.countryCode.toUpperCase() === country.toUpperCase());
    return NextResponse.json(cfg || null);
  }
  return NextResponse.json(KYC_CONFIG);
}
