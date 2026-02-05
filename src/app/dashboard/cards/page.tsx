
'use client';

import { useState, useEffect } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import { CreateVirtualCardForm } from '@/components/create-virtual-card-form';
import { CardsTable } from '@/components/cards-table';
import { CardDetails } from '@/components/card-details';
import type { CreateVirtualCardInput, VirtualCardData } from '@/types/virtual-card';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, type DocumentData, type DocumentSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchCards, createCard, updateCardStatus } from '@/services/cardsService';


type View = 'list' | 'details' | 'create';

export default function VirtualCardsPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [cards, setCards] = useState<VirtualCardData[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [view, setView] = useState<View>('list');
  const [selectedCard, setSelectedCard] = useState<VirtualCardData | null>(null);
  const [isKycVerified, setIsKycVerified] = useState(false);


  useEffect(() => {
    if (!user) {
      if (!authLoading) {
        setLoadingCards(false);
        setCards([]);
      }
      return;
    }

    const unsub = onSnapshot(doc(db, 'users', user.uid), (snapshot: DocumentSnapshot<DocumentData>) => {
      if (snapshot.exists()) {
        const data = snapshot.data() ?? {};
        const status = data.kycStatus;
        setIsKycVerified(typeof status === 'string' && status.toLowerCase() === 'verified');
      }
    });

    return () => unsub();
  }, [user, authLoading]);

  useEffect(() => {
    if (!user || authLoading) return;

    let cancelled = false;
    const loadCards = async () => {
      setLoadingCards(true);
      try {
        const response = await fetchCards();
        if (!cancelled) {
          setCards(response.cards || []);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error fetching cards:', error);
          toast({
            title: 'Error',
            description: 'Could not load cards. Please try again.',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setLoadingCards(false);
      }
    };

    void loadCards();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, toast]);

  const handleCardCreated = async (newCardData: CreateVirtualCardInput) => {
    if (!user) {
      toast({ title: 'Not Authenticated', description: 'You must be logged in to create a card.', variant: 'destructive' });
      return;
    }

    try {
      const response = await createCard(newCardData);
      const created = response.card;
      setCards((prev) => [created, ...prev]);
      toast({
        title: 'Virtual Card Issued!',
        description: `A new ${created.cardModel} card "${created.cardLabel}" has been issued.`,
      });
      setView('list');
    } catch (error) {
      console.error('Error creating card:', error);
      toast({
        title: 'Error',
        description: 'Could not create the virtual card. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = (card: VirtualCardData) => {
    setSelectedCard(card);
    setView('details');
  };

  const handleToggleStatus = async (card: VirtualCardData) => {
    if (!user) {
      toast({ title: 'Not Authenticated', description: 'You must be logged in to update a card.', variant: 'destructive' });
      return;
    }

    const action = card.status === 'active' ? 'freeze' : 'unfreeze';
    try {
      const response = await updateCardStatus(card.id, action);
      setCards((prev) =>
        prev.map((c) => (c.id === card.id ? { ...c, status: response.status } : c))
      );
      if (selectedCard?.id === card.id) {
        setSelectedCard({ ...card, status: response.status });
      }
      toast({
        title: action === 'freeze' ? 'Card Frozen' : 'Card Unfrozen',
        description: `Card status updated to ${response.status}.`,
      });
    } catch (error) {
      console.error('Error updating card status:', error);
      toast({
        title: 'Error',
        description: 'Could not update card status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const renderContent = () => {
    if (authLoading || loadingCards) {
        return <Skeleton className="h-[400px] w-full" />
    }
    
    switch (view) {
      case 'create':
        return <CreateVirtualCardForm onSubmit={handleCardCreated} onCancel={() => setView('list')} isKycVerified={isKycVerified} />;
      case 'details':
        return selectedCard ? <CardDetails card={selectedCard} onToggleStatus={handleToggleStatus} /> : null;
      case 'list':
      default:
        return <CardsTable data={cards} onRowClick={handleViewDetails} onToggleStatus={handleToggleStatus} />;
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
            <Button onClick={() => setView('create')} disabled={!isKycVerified}>
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
