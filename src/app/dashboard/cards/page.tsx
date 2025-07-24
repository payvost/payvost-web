
'use client';

import { useState } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import { CreateVirtualCardForm } from '@/components/create-virtual-card-form';
import { CardsTable } from '@/components/cards-table';
import { CardDetails } from '@/components/card-details';
import type { VirtualCardData } from '@/types/virtual-card';


const initialCards: VirtualCardData[] = [
  {
    id: 'vc_1',
    cardLabel: 'Online Shopping',
    last4: '4284',
    cardType: 'visa',
    expiry: '12/26',
    cvv: '123',
    balance: 250.75,
    currency: 'USD',
    theme: 'blue',
    status: 'active',
    fullNumber: '4012 3456 7890 4284',
    transactions: [
        { id: 'tx_1', description: 'Amazon.com', amount: -45.99, date: '2024-08-15' },
        { id: 'tx_2', description: 'Netflix', amount: -15.49, date: '2024-08-10' },
    ],
    spendingLimit: { amount: 1000, interval: 'monthly' },
    cardModel: 'debit',
  },
  {
    id: 'vc_2',
    cardLabel: 'Subscriptions',
    last4: '8932',
    cardType: 'mastercard',
    expiry: '08/25',
    cvv: '456',
    balance: 50.20,
    currency: 'USD',
    theme: 'purple',
    status: 'frozen',
    fullNumber: '5123 4567 8901 8932',
    transactions: [
        { id: 'tx_3', description: 'Spotify', amount: -10.99, date: '2024-08-01' },
    ],
    spendingLimit: { amount: 100, interval: 'monthly' },
    cardModel: 'debit',
  },
  {
    id: 'vc_3',
    cardLabel: 'Marketing Ads',
    last4: '7766',
    cardType: 'visa',
    expiry: '11/27',
    cvv: '789',
    balance: -450.00, // Negative balance for credit cards represents amount owed
    currency: 'USD',
    theme: 'black',
    status: 'active',
    fullNumber: '4567 1234 5678 7766',
    transactions: [
        { id: 'tx_4', description: 'Google Ads', amount: -250.00, date: '2024-08-12' },
        { id: 'tx_5', description: 'Facebook Ads', amount: -200.00, date: '2024-08-10' },
    ],
    spendingLimit: { amount: 2000, interval: 'monthly' },
    cardModel: 'credit',
    availableCredit: 1550.00,
  },
  {
    id: 'vc_4',
    cardLabel: 'European Trip',
    last4: '3321',
    cardType: 'mastercard',
    expiry: '06/28',
    cvv: '321',
    balance: 850.50,
    currency: 'EUR',
    theme: 'green',
    status: 'active',
    fullNumber: '5555 1234 5678 3321',
    transactions: [
         { id: 'tx_6', description: 'Train Ticket', amount: -75.00, date: '2024-08-14' },
    ],
    spendingLimit: { amount: 2000, interval: 'all_time' },
    cardModel: 'debit',
  },
   {
    id: 'vc_5',
    cardLabel: 'UK Expenses',
    last4: '9876',
    cardType: 'visa',
    expiry: '09/25',
    cvv: '654',
    balance: -120.00,
    currency: 'GBP',
    theme: 'blue',
    status: 'active',
    fullNumber: '4000 5555 6666 9876',
    transactions: [
        { id: 'tx_7', description: 'Tesco', amount: -45.50, date: '2024-08-15' },
        { id: 'tx_8', description: 'Transport for London', amount: -15.00, date: '2024-08-15' },
    ],
    spendingLimit: { amount: 1000, interval: 'monthly' },
    cardModel: 'credit',
    availableCredit: 880.00,
  },
];

type View = 'list' | 'details' | 'create';

export default function VirtualCardsPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const [cards, setCards] = useState<VirtualCardData[]>(initialCards);
  const [view, setView] = useState<View>('list');
  const [selectedCard, setSelectedCard] = useState<VirtualCardData | null>(null);

  const handleCardCreated = (newCardData: Omit<VirtualCardData, 'id' | 'balance' | 'currency' | 'status' | 'fullNumber' | 'transactions'>) => {
    const newCard: VirtualCardData = {
        ...newCardData,
        id: `vc_${Date.now()}`,
        balance: 0,
        currency: 'USD',
        status: 'active',
        fullNumber: `4012 3456 7890 ${Math.floor(1000 + Math.random() * 9000)}`,
        transactions: [],
        cardModel: newCardData.cardModel || 'debit',
    };
    setCards(prev => [...prev, newCard]);
    setView('list');
  }

  const handleViewDetails = (card: VirtualCardData) => {
    setSelectedCard(card);
    setView('details');
  };

  const renderContent = () => {
    switch (view) {
      case 'create':
        return <CreateVirtualCardForm onSubmit={handleCardCreated} onCancel={() => setView('list')} />;
      case 'details':
        return selectedCard ? <CardDetails card={selectedCard} /> : null;
      case 'list':
      default:
        return <CardsTable data={cards} onRowClick={handleViewDetails} />;
    }
  };

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                 {view !== 'list' && (
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setView('list')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                )}
                <h1 className="text-lg font-semibold md:text-2xl">
                    {view === 'list' && 'Virtual Cards'}
                    {view === 'create' && 'Create New Card'}
                    {view === 'details' && `Card Details`}
                </h1>
            </div>
          {view === 'list' && (
            <Button onClick={() => setView('create')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Card
            </Button>
          )}
        </div>
        
        <div className="flex-1">
          {renderContent()}
        </div>

      </main>
    </DashboardLayout>
  );
}
