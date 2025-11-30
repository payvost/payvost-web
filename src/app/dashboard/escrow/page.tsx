
'use client';

import { useState, useEffect } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileDown, ListFilter, MoreHorizontal, Search, ShieldCheck, Handshake, CircleDollarSign, PlusCircle } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Progress } from '@/components/ui/progress';
import { CreateEscrowAgreementForm } from '@/components/create-escrow-agreement-form';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, DocumentData, or, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lock, ArrowRight } from 'lucide-react';

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  'In Escrow': 'default',
  'Awaiting Funding': 'secondary',
  'Funds Released': 'outline',
  'Disputed': 'destructive',
  'Cancelled': 'outline',
};


export default function EscrowPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
  const [view, setView] = useState<'list' | 'create'>('list');
  const { user, loading: authLoading } = useAuth();
  const [agreements, setAgreements] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // Load user data to check tier 3 status
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        setLoadingUser(false);
        return;
    }

    const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        if (doc.exists()) {
            setUserData(doc.data());
        }
        setLoadingUser(false);
    }, (error) => {
        console.error("Error fetching user data:", error);
        setLoadingUser(false);
    });

    return () => unsub();
  }, [user, authLoading]);

  // Check if user has tier 3 access
  const hasTier3Access = userData?.kycProfile?.tiers?.tier3?.status === 'approved' || 
                         userData?.kycTier === 'tier3' || 
                         userData?.userType === 'Tier 3';

  useEffect(() => {
    if (authLoading || loadingUser) return;
    if (!user) {
        setLoading(false);
        return;
    }

    // Only fetch escrow agreements if user has tier 3 access
    if (!hasTier3Access) {
        setLoading(false);
        return;
    }

    const escrowQuery = query(collection(db, 'escrow'), where('userIds', 'array-contains', user.uid));
    
    const unsubscribe = onSnapshot(escrowQuery, (snapshot) => {
        const agreementsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAgreements(agreementsData);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching escrow agreements:", error);
        setLoading(false);
    });
    
    return () => unsubscribe();
  }, [user, authLoading, loadingUser, hasTier3Access]);

  const activeAgreementsCount = agreements.filter(a => ['In Escrow', 'Awaiting Funding'].includes(a.status)).length;
  const totalInEscrow = agreements
    .filter(a => a.status === 'In Escrow' && a.currency === 'USD')
    .reduce((sum, a) => sum + a.totalAmount, 0);


  const renderListView = () => (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Escrow Center</h1>
          <Button onClick={() => setView('create')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Agreement
        </Button>
      </div>

       {loading ? (
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : agreements.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Agreements</CardTitle>
                    <Handshake className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{activeAgreementsCount}</div>
                    <p className="text-xs text-muted-foreground">In progress or awaiting funding.</p>
                </CardContent>
            </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Funds in Escrow (USD)</CardTitle>
                    <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalInEscrow)}
                    </div>
                    <p className="text-xs text-muted-foreground">Total value secured in active USD agreements.</p>
                </CardContent>
            </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Success Rate (Last 90d)</CardTitle>
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">98%</div>
                    <Progress value={98} className="h-2 mt-2" />
                </CardContent>
            </Card>
        </div>
      ) : null}

      <Tabs defaultValue="all">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <TabsList className="overflow-x-auto sm:overflow-visible">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="disputed">Disputed</TabsTrigger>
              </TabsList>
              <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 sm:flex-initial">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                          type="search"
                          placeholder="Search by ID, title..."
                          className="w-full rounded-lg bg-background pl-8 h-9"
                      />
                  </div>
                    <DateRangePicker className="w-full sm:w-auto" />
                  <Button size="sm" variant="outline" className="h-9 gap-1 w-full sm:w-auto">
                      <FileDown className="h-3.5 w-3.5" />
                      <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      Export
                      </span>
                  </Button>
              </div>
          </div>
          <div className="mt-4">
                <Card>
                  <TabsContent value="all">
                      {renderAgreementsTable(agreements)}
                  </TabsContent>
                  <TabsContent value="active">
                      {renderAgreementsTable(agreements.filter(d => ['In Escrow', 'Awaiting Funding'].includes(d.status)))}
                  </TabsContent>
                  <TabsContent value="completed">
                      {renderAgreementsTable(agreements.filter(d => ['Funds Released', 'Cancelled'].includes(d.status)))}
                  </TabsContent>
                  <TabsContent value="disputed">
                      {renderAgreementsTable(agreements.filter(d => d.status === 'Disputed'))}
                  </TabsContent>
                    <CardFooter>
                      <div className="text-xs text-muted-foreground">
                          Showing <strong>1-{agreements.length}</strong> of <strong>{agreements.length}</strong> agreements
                      </div>
                    </CardFooter>
                </Card>
          </div>
      </Tabs>
    </>
  );

  const renderAgreementsTable = (filteredAgreements: typeof agreements) => (
    <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agreement</TableHead>
              <TableHead className="hidden md:table-cell">Parties</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {loading ? (
                [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={5}><Skeleton className="h-12 w-full" /></TableCell>
                    </TableRow>
                ))
            ) : filteredAgreements.length > 0 ? filteredAgreements.map((agreement) => (
              <TableRow key={agreement.id}>
                <TableCell>
                  <div className="font-medium">{agreement.title}</div>
                  <div className="text-sm text-muted-foreground">{agreement.id}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{agreement.buyerEmail}, {agreement.sellerEmail}</TableCell>
                <TableCell className="hidden sm:table-cell">
                    <Badge variant={statusVariant[agreement.status]} className="capitalize">{agreement.status}</Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: agreement.currency }).format(agreement.totalAmount)}
                </TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/escrow/${agreement.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                           <Link href={`/dashboard/escrow/${agreement.id}/manage-funds`}>Manage Funds</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                           <Link href="/dashboard/dispute" className="text-destructive">Raise Dispute</Link>
                        </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                    <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No Agreements Found</h3>
                    <p className="text-sm text-muted-foreground">Get started by creating your first escrow agreement.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
  );

  // Show loading state while checking tier
  if (authLoading || loadingUser) {
    return (
      <DashboardLayout language={language} setLanguage={setLanguage}>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <Skeleton className="h-12 w-full max-w-md" />
          </div>
        </main>
      </DashboardLayout>
    );
  }

  // Show access denied if user doesn't have tier 3
  if (!hasTier3Access) {
    return (
      <DashboardLayout language={language} setLanguage={setLanguage}>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Card className="max-w-2xl mx-auto mt-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <Lock className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle>Access Restricted</CardTitle>
                  <CardDescription>
                    Escrow services are only available to Tier 3 users
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <Lock className="h-4 w-4" />
                <AlertTitle>Tier 3 Verification Required</AlertTitle>
                <AlertDescription>
                  Escrow services require Tier 3: Verified Pro status. To access escrow services, you need to complete the enhanced due diligence verification process.
                </AlertDescription>
              </Alert>
              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Tier 3 Benefits:</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                    <li>Unlimited transactions</li>
                    <li>Escrow services</li>
                    <li>All Tier 2 services</li>
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard/profile')}
                className="flex-1"
              >
                Back to Profile
              </Button>
              <Button 
                onClick={() => {
                  if (userData?.kycProfile?.tiers?.tier2?.status === 'approved') {
                    router.push('/dashboard/kyc/upgrade-tier3');
                  } else {
                    router.push('/dashboard/profile');
                    toast({
                      title: 'Tier 2 Required',
                      description: 'Please complete Tier 2 verification before upgrading to Tier 3.',
                      variant: 'destructive',
                    });
                  }
                }}
                className="flex-1"
              >
                Upgrade to Tier 3
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        {view === 'list' ? renderListView() : <CreateEscrowAgreementForm onBack={() => setView('list')} />}
      </main>
    </DashboardLayout>
  );
}
