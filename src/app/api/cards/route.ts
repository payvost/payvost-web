
import { NextResponse } from 'next/server';

// Placeholder data - in a real app, this would come from a database
const initialCards = [
  {
    id: 'vc_1',
    cardLabel: 'Online Shopping',
    last4: '4284',
    cardType: 'visa' as const,
    expiry: '12/26',
    cvv: '123',
    balance: 250.75,
    currency: 'USD',
    theme: 'blue' as const,
    status: 'active' as const,
    fullNumber: '4012 3456 7890 4284',
  },
  {
    id: 'vc_2',
    cardLabel: 'Subscriptions',
    last4: '8932',
    cardType: 'mastercard' as const,
    expiry: '08/25',
    cvv: '456',
    balance: 50.20,
    currency: 'USD',
    theme: 'purple' as const,
    status: 'frozen' as const,
    fullNumber: '5123 4567 8901 8932',
  },
];


export async function GET() {
    // In a real app, fetch cards for the authenticated user from a database
    return NextResponse.json(initialCards);
}

export async function POST(request: Request) {
    const cardData = await request.json();
    
    // In a real app, you would create the card in your database/payment provider
    // and return the full card object.
    const newCard = {
        ...cardData,
        id: `vc_${Date.now()}`,
        last4: Math.floor(1000 + Math.random() * 9000).toString(),
        expiry: '12/28',
        cvv: Math.floor(100 + Math.random() * 900).toString(),
        balance: 0,
        currency: 'USD',
        status: 'active' as const,
        fullNumber: `4012 3456 7890 ${Math.floor(1000 + Math.random() * 9000)}`,
    };

    // For now, we'll just log it and return a success response
    console.log("Creating new card:", newCard);
    
    return NextResponse.json(newCard, { status: 201 });
}
