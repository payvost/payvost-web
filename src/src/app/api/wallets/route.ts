
import { NextResponse } from 'next/server';

const wallets = [
    { currency: 'USD', name: 'US Dollar', balance: '1,250.75', flag: 'us' },
    { currency: 'EUR', name: 'Euro', balance: '2,500.50', flag: 'eu' },
    { currency: 'GBP', name: 'British Pound', balance: '850.00', flag: 'gb' },
    { currency: 'NGN', name: 'Nigerian Naira', balance: '1,850,000.00', flag: 'ng' },
    { currency: 'JPY', name: 'Japanese Yen', balance: '150,000', flag: 'jp' },
    { currency: 'CAD', name: 'Canadian Dollar', balance: '1,500.00', flag: 'ca' },
    { currency: 'AUD', name: 'Australian Dollar', balance: '950.00', flag: 'au' },
    { currency: 'GHS', name: 'Ghanaian Cedi', balance: '12,500.00', flag: 'gh' },
  ];

export async function GET() {
    // In a real application, this data would be fetched from your database
    // for the currently authenticated user.
    return NextResponse.json(wallets);
}

export async function POST(request: Request) {
    // In a real application, you would add a new wallet for the user in the database.
    const newWallet = await request.json();
    console.log('New wallet to be created:', newWallet);
    
    // For now, we just return the new wallet data with a success message.
    return NextResponse.json({ message: 'Wallet created successfully', wallet: newWallet }, { status: 201 });
}
