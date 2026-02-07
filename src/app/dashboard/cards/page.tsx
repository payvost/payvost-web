
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import { CreateVirtualCardForm } from '@/components/create-virtual-card-form';
import { CardsTable } from '@/components/cards-table';
import { CardDetails } from '@/components/card-details';
import { CardControlsDialog } from '@/components/card-controls-dialog';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, type DocumentData, type DocumentSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchCards, createCard, freezeCard, unfreezeCard, terminateCard } from '@/services/cardsService';
import { walletService, type Account } from '@/services/walletService';
import type { CardSummary, CreateCardRequest, WorkspaceType } from '@/types/cards-v2';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { workspacesService, type WorkspaceMember } from '@/services/workspacesService';
import { WorkspaceTeamDialog } from '@/components/workspace-team-dialog';


type View = 'list' | 'details' | 'create';

export default function VirtualCardsPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [workspaceType, setWorkspaceType] = useState<WorkspaceType>('PERSONAL');
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CardSummary[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [view, setView] = useState<View>('list');
  const [selectedCard, setSelectedCard] = useState<CardSummary | null>(null);
  const [isKycVerified, setIsKycVerified] = useState(false);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [controlsCard, setControlsCard] = useState<CardSummary | null>(null);
  const [teamOpen, setTeamOpen] = useState(false);


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
    const loadAccounts = async () => {
      try {
        const acc = await walletService.getAccounts();
        if (!cancelled) setAccounts(acc);
      } catch (e) {
        if (!cancelled) setAccounts([]);
      }
    };
    void loadAccounts();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  useEffect(() => {
    if (!user || authLoading) return;

    let cancelled = false;
    const loadCards = async () => {
      setLoadingCards(true);
      try {
        const response = await fetchCards({ workspaceType, limit: 100 });
        if (!cancelled) {
          setWorkspaceId(response.workspaceId || null);
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
  }, [user, authLoading, toast, workspaceType]);

  useEffect(() => {
    if (!user || authLoading) return;
    if (workspaceType !== 'BUSINESS') {
      setMembers([]);
      return;
    }
    if (!workspaceId) {
      setMembers([]);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const resp = await workspacesService.listMembers(workspaceId);
        if (!cancelled) setMembers(resp.members || []);
      } catch {
        if (!cancelled) setMembers([]);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, workspaceId, workspaceType]);

  const filteredAccounts = useMemo(
    () => accounts.filter((a) => a.type === (workspaceType === 'BUSINESS' ? 'BUSINESS' : 'PERSONAL')),
    [accounts, workspaceType]
  );

  const handleCardCreated = async (newCardData: CreateCardRequest) => {
    if (!user) {
      toast({ title: 'Not Authenticated', description: 'You must be logged in to create a card.', variant: 'destructive' });
      return;
    }

    try {
      const response = await createCard(newCardData);
      const created = response.card as any as CardSummary;
      setCards((prev) => [created, ...prev]);
      toast({
        title: 'Virtual Card Issued!',
        description: `A new card "${created.label}" has been issued.`,
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

  const handleViewDetails = (card: CardSummary) => {
    setSelectedCard(card);
    setView('details');
  };

  const handleToggleStatus = async (card: CardSummary) => {
    if (!user) {
      toast({ title: 'Not Authenticated', description: 'You must be logged in to update a card.', variant: 'destructive' });
      return;
    }

    try {
      const response = card.status === 'ACTIVE' ? await freezeCard(card.id) : await unfreezeCard(card.id);
      setCards((prev) =>
        prev.map((c) => (c.id === card.id ? { ...c, status: response.status as any } : c))
      );
      if (selectedCard?.id === card.id) {
        setSelectedCard({ ...card, status: response.status as any });
      }
      toast({
        title: card.status === 'ACTIVE' ? 'Card Frozen' : 'Card Unfrozen',
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

  const handleTerminate = async (card: CardSummary) => {
    if (!user) {
      toast({ title: 'Not Authenticated', description: 'You must be logged in to update a card.', variant: 'destructive' });
      return;
    }
    try {
      const response = await terminateCard(card.id);
      setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, status: response.status as any } : c)));
      if (selectedCard?.id === card.id) setSelectedCard({ ...card, status: response.status as any });
      toast({ title: 'Card Terminated', description: 'This card can no longer be used.' });
    } catch (error) {
      console.error('Error terminating card:', error);
      toast({ title: 'Error', description: 'Could not terminate card. Please try again.', variant: 'destructive' });
    }
  };

  const renderContent = () => {
    if (authLoading || loadingCards) {
        return <Skeleton className="h-[400px] w-full" />
    }
    
    switch (view) {
      case 'create':
        return (
          <CreateVirtualCardForm
            workspaceType={workspaceType}
            workspaceId={workspaceId}
            accounts={accounts}
            members={members}
            currentUserId={user?.uid || null}
            onSubmit={handleCardCreated}
            onCancel={() => setView('list')}
            isKycVerified={isKycVerified && filteredAccounts.length > 0}
          />
        );
      case 'details':
        return selectedCard ? (
          <CardDetails
            card={selectedCard}
            onFreezeToggle={handleToggleStatus}
            onTerminate={handleTerminate}
            onOpenControls={(card) => {
              setControlsCard(card);
              setControlsOpen(true);
            }}
          />
        ) : null;
      case 'list':
      default:
        return <CardsTable data={cards} onRowClick={handleViewDetails} onFreezeToggle={handleToggleStatus} onTerminate={handleTerminate} />;
    }
  };

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        {!isKycVerified && (
          <Alert>
            <AlertTitle>KYC required</AlertTitle>
            <AlertDescription>
              Cards are disabled until your identity verification is complete.{' '}
              <Link href="/dashboard/get-started/verify" className="underline">
                Complete verification
              </Link>
              .
            </AlertDescription>
          </Alert>
        )}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                 {view !== 'list' && (
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setView('list')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                )}
                <h1 className="text-lg font-semibold md:text-2xl">
                    {view === 'list' && 'Cards Center'}
                    {view === 'create' && 'Create New Card'}
                    {view === 'details' && `Card Details`}
                </h1>
            </div>
          {view === 'list' && (
            <div className="flex items-center gap-3">
              <div className="flex space-x-1 rounded-lg bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setWorkspaceType('PERSONAL')}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    workspaceType === 'PERSONAL' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Personal
                </button>
                <button
                  type="button"
                  onClick={() => setWorkspaceType('BUSINESS')}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    workspaceType === 'BUSINESS' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Business
                </button>
              </div>

              {workspaceType === 'BUSINESS' && (
                <Button variant="outline" onClick={() => setTeamOpen(true)} disabled={!workspaceId}>
                  Team
                </Button>
              )}

              <Button onClick={() => setView('create')} disabled={!isKycVerified || filteredAccounts.length === 0}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Card
              </Button>
            </div>
          )}
        </div>

        <WorkspaceTeamDialog
          open={teamOpen}
          onOpenChange={setTeamOpen}
          workspaceId={workspaceId}
          members={members}
          onMembersChanged={setMembers}
        />

        <CardControlsDialog
          open={controlsOpen}
          onOpenChange={setControlsOpen}
          card={controlsCard}
          onUpdated={(next) => {
            if (!controlsCard) return;
            setCards((prev) => prev.map((c) => (c.id === controlsCard.id ? { ...c, controls: next } : c)));
            if (selectedCard?.id === controlsCard.id) setSelectedCard({ ...selectedCard, controls: next });
          }}
        />
        
        <div className="flex-1">
          {renderContent()}
        </div>

      </main>
    </DashboardLayout>
  );
}
