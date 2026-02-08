'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Plus } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, type DocumentData, type DocumentSnapshot } from 'firebase/firestore';

import { walletService, type Account } from '@/services/walletService';
import { fetchCards, createCard, freezeCard, unfreezeCard, terminateCard } from '@/services/cardsService';
import { workspacesService, type WorkspaceMember } from '@/services/workspacesService';

import type { CardSummary, CreateCardRequest, WorkspaceType, CardType } from '@/types/cards-v2';
import { cn } from '@/lib/utils';
import { CardsTable } from '@/components/cards-table';
import { CardDetails } from '@/components/card-details';
import { CreateVirtualCardForm } from '@/components/create-virtual-card-form';
import { WorkspaceTeamDialog } from '@/components/workspace-team-dialog';
import { CardControlsDialog } from '@/components/card-controls-dialog';

type CardTypeFilter = 'ALL' | CardType;

export default function CardsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [workspaceType, setWorkspaceType] = useState<WorkspaceType>('PERSONAL');
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CardSummary[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(true);

  const [isKycVerified, setIsKycVerified] = useState(false);
  const [typeFilter, setTypeFilter] = useState<CardTypeFilter>('ALL');

  const [createOpen, setCreateOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [controlsCard, setControlsCard] = useState<CardSummary | null>(null);

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
      } catch {
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
        const resp = await fetchCards({ workspaceType, limit: 100 });
        if (cancelled) return;
        setWorkspaceId(resp.workspaceId || null);
        setCards(resp.cards || []);
      } catch (error) {
        if (!cancelled) {
          console.error('Error fetching cards:', error);
          toast({ title: 'Error', description: 'Could not load cards. Please try again.', variant: 'destructive' });
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

  const filteredCards = useMemo(() => {
    const base = cards;
    const byType = typeFilter === 'ALL' ? base : base.filter((c) => c.type === typeFilter);
    return byType;
  }, [cards, typeFilter]);

  const selectedCard = useMemo(() => {
    if (!selectedCardId) return null;
    return cards.find((c) => c.id === selectedCardId) || null;
  }, [cards, selectedCardId]);

  // Keep selection valid across filters.
  useEffect(() => {
    if (!selectedCardId) return;
    if (typeFilter === 'ALL') return;
    const exists = cards.some((c) => c.id === selectedCardId && c.type === typeFilter);
    if (!exists) setSelectedCardId(null);
  }, [cards, selectedCardId, typeFilter]);

  // Default-select the first card (for the dropdown UX).
  useEffect(() => {
    if (selectedCardId) return;
    if (filteredCards.length === 0) return;
    setSelectedCardId(filteredCards[0].id);
  }, [filteredCards, selectedCardId]);

  const onSelectCard = (card: CardSummary) => {
    setSelectedCardId(card.id);
    setDetailsOpen(true);
  };

  const handleToggleStatus = async (card: CardSummary) => {
    try {
      const resp = card.status === 'ACTIVE' ? await freezeCard(card.id) : await unfreezeCard(card.id);
      setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, status: resp.status as any } : c)));
      toast({ title: 'Updated', description: `Card status is now ${resp.status}.` });
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Could not update card status.', variant: 'destructive' });
    }
  };

  const handleTerminate = async (card: CardSummary) => {
    try {
      const resp = await terminateCard(card.id);
      setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, status: resp.status as any } : c)));
      toast({ title: 'Card terminated', description: 'This card can no longer be used.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Could not terminate card.', variant: 'destructive' });
    }
  };

  const handleCreated = async (payload: CreateCardRequest) => {
    try {
      const resp = await createCard(payload);
      const created = resp.card as CardSummary;
      setCards((prev) => [created, ...prev]);
      setSelectedCardId(created.id);
      setDetailsOpen(true);
      setCreateOpen(false);
      toast({ title: 'Card issued', description: `"${created.label}" has been issued.` });
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Could not create card.', variant: 'destructive' });
    }
  };

  const listHeader = (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold md:text-2xl">Cards</h1>
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
      </div>

      <div className="flex items-center gap-2">
        {workspaceType === 'BUSINESS' && (
          <Button variant="outline" onClick={() => setTeamOpen(true)} disabled={!workspaceId}>
            Team
          </Button>
        )}
        <Button onClick={() => setCreateOpen(true)} disabled={!isKycVerified || filteredAccounts.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          Add Card
        </Button>
      </div>
    </div>
  );

  const filtersRow = (
    <div className="flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex space-x-1 rounded-lg bg-muted p-1 w-fit">
        <button
          type="button"
          onClick={() => setTypeFilter('ALL')}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            typeFilter === 'ALL' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          View All
        </button>
        <button
          type="button"
          onClick={() => setTypeFilter('PHYSICAL')}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            typeFilter === 'PHYSICAL' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Physical Cards
        </button>
        <button
          type="button"
          onClick={() => setTypeFilter('VIRTUAL')}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            typeFilter === 'VIRTUAL' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Virtual Cards
        </button>
      </div>

      <div className="flex-1" />

      <div className="w-full md:w-[380px]">
        <Select
          value={selectedCardId || undefined}
          onValueChange={(v) => {
            setSelectedCardId(v);
            setDetailsOpen(true);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a card" />
          </SelectTrigger>
          <SelectContent>
            {filteredCards.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label} ({c.type.toLowerCase()}) - **** {c.last4}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const canCreate = isKycVerified && filteredAccounts.length > 0;

  return (
    <>
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

        {listHeader}
        {filtersRow}

        {authLoading || loadingCards ? (
          <Skeleton className="h-[420px] w-full" />
        ) : (
          <>
            <CardsTable
              data={filteredCards}
              selectedCardId={selectedCardId}
              onRowClick={onSelectCard}
              onFreezeToggle={handleToggleStatus}
              onTerminate={handleTerminate}
            />

            <Accordion
              type="single"
              collapsible
              value={selectedCard && detailsOpen ? 'details' : undefined}
              onValueChange={(v) => setDetailsOpen(Boolean(v))}
              className="rounded-md border bg-background"
            >
              <AccordionItem value="details" className="border-none">
                <AccordionTrigger className="px-4">
                  {selectedCard ? `Card Summary: ${selectedCard.label}` : 'Card Summary'}
                </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
                  {selectedCard ? (
                    <CardDetails
                      card={selectedCard}
                      onFreezeToggle={handleToggleStatus}
                      onTerminate={handleTerminate}
                      onOpenControls={(card) => {
                        setControlsCard(card);
                        setControlsOpen(true);
                      }}
                    />
                  ) : (
                    <div className="text-sm text-muted-foreground">Select a card to view details.</div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        )}

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Card</DialogTitle>
              <DialogDescription>Issue a new card for this workspace.</DialogDescription>
            </DialogHeader>
            <CreateVirtualCardForm
              workspaceType={workspaceType}
              workspaceId={workspaceId}
              accounts={accounts}
              members={members}
              currentUserId={user?.uid || null}
              onSubmit={handleCreated}
              onCancel={() => setCreateOpen(false)}
              isKycVerified={canCreate}
            />
          </DialogContent>
        </Dialog>

        <CardControlsDialog
          open={controlsOpen}
          onOpenChange={setControlsOpen}
          card={controlsCard}
          onUpdated={(next) => {
            if (!controlsCard) return;
            setCards((prev) => prev.map((c) => (c.id === controlsCard.id ? { ...c, controls: next } : c)));
          }}
        />

        <WorkspaceTeamDialog
          open={teamOpen}
          onOpenChange={setTeamOpen}
          workspaceId={workspaceId}
          members={members}
          onMembersChanged={setMembers}
        />
      </main>
    </>
  );
}
