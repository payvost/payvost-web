
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, CreditCard, Shield, SlidersHorizontal, Search, RefreshCw, MoreHorizontal, Download, TrendingUp, AlertTriangle, Lock, Unlock, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { VirtualCardData } from '@/types/virtual-card';
import { cn } from '@/lib/utils';

interface CardStats {
    totalActive: number;
    totalSpending30d: number;
    fraudBlocks24h: number;
    avgSpendingPerCard: number;
    frozenCount: number;
    terminatedCount: number;
}

const sampleCards: VirtualCardData[] = [
    { id: 'vc_1', cardLabel: 'Marketing Team', last4: '4284', cardType: 'visa', balance: 2500.75, currency: 'USD', status: 'active', fullNumber: '', expiry: '', cvv: '', transactions: [], theme: 'blue', cardModel: 'debit' },
    { id: 'vc_2', cardLabel: 'Development Subscriptions', last4: '8932', cardType: 'mastercard', balance: 500.20, currency: 'USD', status: 'active', fullNumber: '', expiry: '', cvv: '', transactions: [], theme: 'purple', cardModel: 'debit' },
    { id: 'vc_3', cardLabel: 'CEO Travel Card', last4: '7766', cardType: 'visa', balance: 10000.00, currency: 'USD', status: 'frozen', fullNumber: '', expiry: '', cvv: '', transactions: [], theme: 'green', cardModel: 'debit' },
    { id: 'vc_4', cardLabel: 'UK Office Expenses', last4: '9876', cardType: 'visa', balance: 8500.00, currency: 'GBP', status: 'active', fullNumber: '', expiry: '', cvv: '', transactions: [], theme: 'black', cardModel: 'debit' },
    { id: 'vc_5', cardLabel: 'Terminated Card', last4: '1111', cardType: 'mastercard', balance: 0.00, currency: 'USD', status: 'terminated', fullNumber: '', expiry: '', cvv: '', transactions: [], theme: 'blue', cardModel: 'debit' },
];

export default function CardManagementPage() {
    const router = useRouter();
    const [cards, setCards] = useState<VirtualCardData[]>(sampleCards);
    const [stats, setStats] = useState<CardStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const { toast } = useToast();

    useEffect(() => {
        // Calculate stats from cards
        const totalActive = cards.filter(c => c.status === 'active').length;
        const totalSpending = cards.reduce((sum, c) => sum + c.balance, 0);
        const frozenCount = cards.filter(c => c.status === 'frozen').length;
        const terminatedCount = cards.filter(c => c.status === 'terminated').length;
        
        setStats({
            totalActive,
            totalSpending30d: totalSpending,
            fraudBlocks24h: 12, // Mock data
            avgSpendingPerCard: totalActive > 0 ? totalSpending / totalActive : 0,
            frozenCount,
            terminatedCount,
        });
    }, [cards]);

    const filteredCards = cards.filter(card => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            if (!card.cardLabel.toLowerCase().includes(query) &&
                !card.last4.includes(query)) {
                return false;
            }
        }
        if (activeTab === 'all') return true;
        return card.status === activeTab;
    });

    const handleCardAction = async (cardId: string, action: 'freeze' | 'unfreeze' | 'terminate') => {
        try {
            setLoading(true);
            // TODO: API call
            setCards(cards.map(card => {
                if (card.id === cardId) {
                    if (action === 'freeze') return { ...card, status: 'frozen' };
                    if (action === 'unfreeze') return { ...card, status: 'active' };
                    if (action === 'terminate') return { ...card, status: 'terminated', balance: 0 };
                }
                return card;
            }));
            toast({
                title: 'Success',
                description: `Card ${action === 'freeze' ? 'frozen' : action === 'unfreeze' ? 'unfrozen' : 'terminated'} successfully`,
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to perform action',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const csvContent = [
            ['ID', 'Label', 'Last 4', 'Type', 'Status', 'Balance', 'Currency'].join(','),
            ...filteredCards.map(card => [
                card.id,
                `"${card.cardLabel}"`,
                card.last4,
                card.cardType,
                card.status,
                card.balance,
                card.currency,
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cards-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
            title: 'Export successful',
            description: 'Cards exported to CSV',
        });
    };

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Card Operations</h2>
                    <p className="text-muted-foreground">Issue, manage, and monitor all virtual cards.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => window.location.reload()} disabled={loading}>
                        <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                        Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Button variant="outline" size="sm">
                        <SlidersHorizontal className="mr-2 h-4 w-4"/>
                        Configure Rules
                    </Button>
                    <Button onClick={() => router.push('/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/card-management/create')}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Issue New Card
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Active Cards</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalActive}</div>
                            <p className="text-xs text-muted-foreground">+201 from last month</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Spending (30d)</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(stats.totalSpending30d)}
                            </div>
                            <p className="text-xs text-muted-foreground">+180.1% from last month</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Fraud Blocks (24h)</CardTitle>
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.fraudBlocks24h}</div>
                            <p className="text-xs text-muted-foreground">+5 since last hour</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Frozen Cards</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.frozenCount}</div>
                            <p className="text-xs text-muted-foreground">Require attention</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <TabsList>
                                <TabsTrigger value="all">All Cards</TabsTrigger>
                                <TabsTrigger value="active">Active</TabsTrigger>
                                <TabsTrigger value="frozen">Frozen</TabsTrigger>
                                <TabsTrigger value="terminated">Terminated</TabsTrigger>
                            </TabsList>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search by card label, last 4 digits..."
                                    className="w-full rounded-lg bg-background pl-8 md:w-[320px]"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-16 w-full" />
                                ))}
                            </div>
                        ) : filteredCards.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">No cards found</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Card</TableHead>
                                        <TableHead>User / Team</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Balance</TableHead>
                                        <TableHead><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCards.map((card) => (
                                        <TableRow 
                                            key={card.id} 
                                            onClick={() => router.push(`/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/card-management/${card.id}`)} 
                                            className="cursor-pointer"
                                        >
                                            <TableCell>
                                                <div className="font-medium">{card.cardLabel}</div>
                                                <div className="text-sm text-muted-foreground font-mono">•••• {card.last4}</div>
                                            </TableCell>
                                            <TableCell>Marketing Team</TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant={card.status === 'active' ? 'default' : card.status === 'frozen' ? 'secondary' : 'destructive'} 
                                                    className="capitalize"
                                                >
                                                    {card.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: card.currency }).format(card.balance)}
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        {card.status === 'active' ? (
                                                            <DropdownMenuItem onClick={() => handleCardAction(card.id, 'freeze')}>
                                                                <Lock className="mr-2 h-4 w-4" />
                                                                Freeze Card
                                                            </DropdownMenuItem>
                                                        ) : card.status === 'frozen' ? (
                                                            <DropdownMenuItem onClick={() => handleCardAction(card.id, 'unfreeze')}>
                                                                <Unlock className="mr-2 h-4 w-4" />
                                                                Unfreeze Card
                                                            </DropdownMenuItem>
                                                        ) : null}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                            className="text-destructive"
                                                            onClick={() => handleCardAction(card.id, 'terminate')}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Terminate Card
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                    <CardFooter>
                        <div className="text-xs text-muted-foreground">
                            Showing <strong>1-{filteredCards.length}</strong> of <strong>{cards.length}</strong> cards
                        </div>
                    </CardFooter>
                </Card>
            </Tabs>
        </>
    );
}
