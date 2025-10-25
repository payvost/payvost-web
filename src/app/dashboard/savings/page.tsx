
'use client';

import { useState, useEffect } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { KpiCard } from '@/components/savings/kpi-card';
import { SavingsChart } from '@/components/savings/savings-chart';
import { CreateGoalForm } from '@/components/savings/create-goal-form';
import { SavingsGoalList } from '@/components/savings/savings-goal-list';
import { LineChart, DollarSign, Target, PlusCircle } from 'lucide-react';
import type { SavingsGoal } from '@/types/savings-goal';

type SavingsView = 'dashboard' | 'createGoal';

export default function SavingsPage() {
    const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
    const { user } = useAuth();
    const [goals, setGoals] = useState<SavingsGoal[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<SavingsView>('dashboard');

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const goalsQuery = query(collection(db, `users/${user.uid}/savings_plans`));
        const unsubGoals = onSnapshot(goalsQuery, (snapshot) => {
            const fetchedGoals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavingsGoal));
            setGoals(fetchedGoals);
            setLoading(false);
        });

        return () => unsubGoals();
    }, [user]);
    
    const totalSaved = goals.reduce((sum, goal) => sum + (goal.currentAmount || 0), 0);
    const totalGoal = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    
    const kpiData = [
        { title: "Total Saved", value: totalSaved, prefix: "$", icon: <DollarSign /> },
        { title: "Active Goals", value: goals.filter(g => g.status === 'active').length, icon: <Target /> },
        { title: "Overall Progress", value: totalGoal > 0 ? (totalSaved / totalGoal) * 100 : 0, suffix: "%", icon: <LineChart strokeWidth={2.5}/> },
    ];
    
    const renderContent = () => {
        if (loading) {
            return (
                 <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
                    </div>
                    <Skeleton className="h-80 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            );
        }

        if (view === 'createGoal') {
            return <CreateGoalForm onGoalCreated={() => setView('dashboard')} onBack={() => setView('dashboard')} />;
        }
        
        return (
            <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold md:text-2xl">Smart Savings</h1>
                        <p className="text-muted-foreground text-sm">Your automated savings and goals dashboard.</p>
                    </div>
                    <Button onClick={() => setView('createGoal')}><PlusCircle className="mr-2 h-4 w-4"/>New Savings Goal</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {kpiData.map(kpi => <KpiCard key={kpi.title} {...kpi} />)}
                </div>
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-2 space-y-6">
                        <SavingsChart goals={goals}/>
                        <SavingsGoalList goals={goals} onEditGoal={(id) => { /* Logic to edit */ }}/>
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        {/* Placeholder for AutoSave and Round-up components */}
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                </div>
            </div>
        );
    }


    return (
        <DashboardLayout language={language} setLanguage={setLanguage}>
            <main className="flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                {renderContent()}
            </main>
        </DashboardLayout>
    );
}
