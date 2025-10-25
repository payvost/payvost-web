
'use client';

import { useState, useEffect } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, BarChart, MoreHorizontal, ArrowRight, Eye, ChevronLeft, PiggyBank } from 'lucide-react';
import type { UserInvestment } from '@/types/investment';
import { InvestmentPortfolioChart } from '@/components/investment/investment-portfolio-chart';
import { SavingsGoalList } from '@/components/savings/savings-goal-list';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SavingsGoal } from '@/types/savings-goal';
import { Skeleton } from '@/components/ui/skeleton';

export default function InvestmentPortfolioPage() {
    const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
    const { user, loading: authLoading } = useAuth();
    const [goals, setGoals] = useState<SavingsGoal[]>([]);
    const [investments, setInvestments] = useState<(UserInvestment & { title: string, category: string })[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        if (authLoading || !user) {
            if (!authLoading) setLoading(false);
            return;
        }

        const goalsQuery = query(collection(db, `users/${user.uid}/savings_plans`));
        const unsubGoals = onSnapshot(goalsQuery, (snapshot) => {
            const fetchedGoals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavingsGoal));
            setGoals(fetchedGoals);
            if(!loading) setLoading(false);
        }, (error) => {
            console.error("Error fetching savings goals:", error);
        });

        const investmentsQuery = query(collection(db, `users/${user.uid}/user_investments`));
        const unsubInvestments = onSnapshot(investmentsQuery, (snapshot) => {
             const fetchedInvestments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as (UserInvestment & { title: string, category: string })));
            setInvestments(fetchedInvestments);
            if(!loading) setLoading(false);
        }, (error) => {
            console.error("Error fetching investments:", error);
        });

        // Combine loading state logic
        const allDataLoaded = () => {
            setLoading(false);
        }
        
        const timer = setTimeout(allDataLoaded, 1500);


        return () => {
            unsubGoals();
            unsubInvestments();
            clearTimeout(timer);
        };
    }, [user, authLoading]);

    const totalInvested = investments.reduce((sum, i) => sum + i.amountInvested, 0);
    const totalCurrentValue = investments.reduce((sum, i) => sum + i.currentValue, 0);
    const totalSavings = goals.reduce((sum, goal) => sum + (goal.currentAmount || 0), 0);
    const totalAssets = totalCurrentValue + totalSavings;
    const totalReturns = totalCurrentValue - totalInvested;

    if (loading) {
        return (
             <DashboardLayout language={language} setLanguage={setLanguage}>
                 <main className="flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                     <Skeleton className="h-8 w-1/3 mb-6" />
                     <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
                     </div>
                     <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <div className="lg:col-span-3"><Skeleton className="h-96 w-full" /></div>
                        <div className="lg:col-span-2 space-y-6"><Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" /></div>
                     </div>
                 </main>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout language={language} setLanguage={setLanguage}>
             <main className="flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                 <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-lg font-semibold md:text-2xl">My Portfolio</h1>
                            <p className="text-muted-foreground text-sm">A complete overview of your savings and investments.</p>
                        </div>
                    </div>
                </div>
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle><BarChart className="h-4 w-4 text-muted-foreground" /></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalAssets)}</div></CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Savings</CardTitle><PiggyBank className="h-4 w-4 text-muted-foreground" /></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalSavings)}</div></CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Investments</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalCurrentValue)}</div></CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">All-Time Returns</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-green-600">+{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalReturns)}</div></CardContent>
                    </Card>
                </div>
                
                 <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                     <div className="lg:col-span-3">
                         <Card>
                            <CardHeader>
                                <CardTitle>Portfolio History</CardTitle>
                                <CardDescription>Growth of your combined portfolio over time.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-80">
                                <InvestmentPortfolioChart />
                            </CardContent>
                        </Card>
                    </div>
                     <div className="lg:col-span-2 space-y-6">
                        <Card>
                             <CardHeader>
                                <CardTitle>Explore More Opportunities</CardTitle>
                                <CardDescription>Diversify your portfolio by exploring new asset classes.</CardDescription>
                            </CardHeader>
                             <CardFooter>
                                <Button className="w-full" asChild>
                                    <Link href="/dashboard/investment/browse">
                                        Browse Investments <ArrowRight className="ml-2 h-4 w-4"/>
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Savings Goals</CardTitle>
                            </CardHeader>
                             <CardContent>
                                <SavingsGoalList goals={goals.slice(0, 2)} onEditGoal={() => {}}/>
                            </CardContent>
                             <CardFooter>
                                <Button variant="outline" className="w-full" asChild>
                                    <Link href="/dashboard/savings">Manage All Savings</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>

                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Your Investments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Investment</TableHead>
                                    <TableHead>Amount Invested</TableHead>
                                    <TableHead>Current Value</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {investments.length > 0 ? investments.map(inv => {
                                    const returns = inv.currentValue - inv.amountInvested;
                                    const roi = inv.amountInvested > 0 ? (returns / inv.amountInvested) * 100 : 0;
                                    return (
                                        <TableRow key={inv.id}>
                                            <TableCell>
                                                <div className="font-medium">{inv.title}</div>
                                                <div className="text-xs text-muted-foreground">{inv.category}</div>
                                            </TableCell>
                                            <TableCell>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(inv.amountInvested)}</TableCell>
                                            <TableCell>
                                                <div>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(inv.currentValue)}</div>
                                                <div className="text-xs text-green-600">+{roi.toFixed(2)}%</div>
                                            </TableCell>
                                            <TableCell>{inv.status}</TableCell>
                                            <TableCell>
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuItem>View Details</DropdownMenuItem>
                                                        <DropdownMenuItem>Top Up Investment</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                }) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">You have not made any investments yet.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </DashboardLayout>
    );
}
