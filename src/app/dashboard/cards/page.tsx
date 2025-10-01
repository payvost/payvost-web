
'use client';

import { useState, useEffect } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { CreateVirtualCardForm } from '@/components/create-virtual-card-form';
import { CardsTable } from '@/components/cards-table';
import { CardDetails } from '@/components/card-details';
import type { VirtualCardData } from '@/types/virtual-card';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';


type View = 'list' | 'details' | 'create';

export default function VirtualCardsPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [cards, setCards] = useState<VirtualCardData[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [view, setView] = useState<View>('list');
  const [selectedCard, setSelectedCard] = useState<VirtualCardData | null>(null);

   useEffect(() => {
    if (!user) {
      if (!authLoading) setLoadingCards(false);
      return;
    }

    const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
        if (doc.exists()) {
            setCards(doc.data().cards || []);
        }
        setLoadingCards(false);
    });

    return () => unsub();
  }, [user, authLoading]);

  const handleCardCreated = async (newCardData: Omit<VirtualCardData, 'id' | 'balance' | 'currency' | 'status' | 'fullNumber' | 'transactions' | 'last4' | 'expiry' | 'cvv'>) => {
    if (!user) {
        toast({ title: "Not Authenticated", description: "You must be logged in to create a card.", variant: "destructive" });
        return;
    }
    
    const newCard: VirtualCardData = {
        ...newCardData,
        id: `vc_${Date.now()}`,
        last4: Math.floor(1000 + Math.random() * 9000).toString(),
        expiry: `${String(Math.floor(1 + Math.random() * 12)).padStart(2, '0')}/${new Date().getFullYear() % 100 + 3}`,
        cvv: Math.floor(100 + Math.random() * 900).toString(),
        balance: 0,
        currency: 'USD',
        status: 'active',
        fullNumber: `4${Math.floor(100 + Math.random() * 900)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`.substring(0,19),
        transactions: [],
    };
    
     if (newCard.cardModel === 'credit') {
        newCard.availableCredit = newCard.spendingLimit?.amount || 5000; // Default credit limit
    }

    try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
            cards: arrayUnion(newCard)
        });
        toast({
            title: "Virtual Card Issued!",
            description: `A new ${newCard.cardModel} card "${newCard.cardLabel}" has been issued.`,
        });
        setView('list');
    } catch (error) {
        console.error("Error creating card:", error);
        toast({
            title: "Error",
            description: "Could not create the virtual card. Please try again.",
            variant: "destructive"
        });
    }
  }

  const handleViewDetails = (card: VirtualCardData) => {
    setSelectedCard(card);
    setView('details');
  };

  const renderContent = () => {
    if (authLoading || loadingCards) {
        return <Skeleton className="h-[400px] w-full" />
    }
    
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
