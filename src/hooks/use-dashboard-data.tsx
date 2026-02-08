
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { walletService } from '@/services';
import type { Account } from '@/services';
import { db } from '@/lib/firebase';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';
import { doc, onSnapshot, Timestamp, collection, query, orderBy, limit, where, addDoc, serverTimestamp, DocumentData, updateDoc, getDocs } from 'firebase/firestore';
import { ArrowRightLeft, Smartphone } from 'lucide-react';
import React from 'react';
import { SUPPORTED_COUNTRIES } from '@/config/kyc-config';

export interface MonthlyData {
    month: string;
    income: number;
    expense: number;
    date: Date;
}

export interface SpendingItem {
    category: string;
    amount: number;
    total: number;
    icon: React.ReactNode;
}

const defaultSpendingData: SpendingItem[] = [
    { category: 'Transfers', amount: 0, total: 1, icon: <ArrowRightLeft className="h-5 w-5 text-primary" /> },
    { category: 'Bill Payments', amount: 0, total: 1, icon: <Smartphone className="h-5 w-5 text-primary" /> },
];

type DashboardTransaction = {
    createdAt?: Timestamp;
    date?: string;
    type?: string;
    sendAmount?: string;
    amount?: string;
};

export function useDashboardData() {
    const { user, loading: authLoading } = useAuth();
    const [wallets, setWallets] = useState<Account[]>([]);
    const [loadingWallets, setLoadingWallets] = useState(true);
    const [isKycVerified, setIsKycVerified] = useState(false);
    const [homeCurrency, setHomeCurrency] = useState<string | null>(null);
    const [defaultWalletCurrency, setDefaultWalletCurrency] = useState<string | null>(null);
    const [chartData, setChartData] = useState<MonthlyData[]>([]);
    const [spendingData, setSpendingData] = useState<SpendingItem[]>(defaultSpendingData);
    const [hasTransactionData, setHasTransactionData] = useState(false);
    const [invoices, setInvoices] = useState<DocumentData[]>([]);
    const [loadingInvoices, setLoadingInvoices] = useState(true);
    const [disputes, setDisputes] = useState<DocumentData[]>([]);
    const [loadingDisputes, setLoadingDisputes] = useState(true);
    const [needsPin, setNeedsPin] = useState(false);
    const [pinDialogOpen, setPinDialogOpen] = useState(false);

    const processTransactionsForSpending = (transactions: DashboardTransaction[]) => {
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        const monthlySpending = transactions
            .filter(tx => {
                const txDate = tx.createdAt instanceof Timestamp ? tx.createdAt.toDate() : (tx.date ? new Date(tx.date) : new Date(0));
                return tx.type !== 'inflow' && txDate.getMonth() === thisMonth && txDate.getFullYear() === thisYear;
            })
            .reduce((acc, tx) => {
                const category = tx.type === 'Transfer' ? 'Transfers' : 'Bill Payments';
                const amount = parseFloat(tx.sendAmount || tx.amount || '0');
                acc[category] = (acc[category] || 0) + amount;
                return acc;
            }, {} as Record<string, number>);

        const totalSpent = (Object.values(monthlySpending) as number[]).reduce((sum: number, amount: number) => sum + amount, 0);

        const newSpendingData: SpendingItem[] = [
            { category: 'Transfers', amount: monthlySpending['Transfers'] || 0, total: totalSpent || 1, icon: <ArrowRightLeft className="h-5 w-5 text-primary" /> },
            { category: 'Bill Payments', amount: monthlySpending['Bill Payments'] || 0, total: totalSpent || 1, icon: <Smartphone className="h-5 w-5 text-primary" /> },
        ];
        setSpendingData(newSpendingData);
    }

    const processTransactionsForChart = (transactions: DashboardTransaction[]): MonthlyData[] => {
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const monthlyData: { [key: string]: { income: number; expense: number } } = {};

        // Initialize last 6 months
        for (let i = 0; i < 6; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            monthlyData[monthKey] = { income: 0, expense: 0 };
        }

        transactions.forEach((tx) => {
            const txDate = tx.createdAt instanceof Timestamp ? tx.createdAt.toDate() : (tx.date ? new Date(tx.date) : new Date(0));
            if (txDate >= sixMonthsAgo) {
                const monthKey = `${txDate.getFullYear()}-${txDate.getMonth()}`;
                const amount = parseFloat(tx.sendAmount || tx.amount || '0');
                if (tx.type === 'inflow') {
                    monthlyData[monthKey].income += amount;
                } else if (tx.type === 'outflow' || tx.type === 'Transfer' || tx.type === 'Bill Payment') {
                    monthlyData[monthKey].expense += amount;
                }
            }
        });

        const chartData = Object.keys(monthlyData).map(key => {
            const [year, month] = key.split('-').map(Number);
            return {
                month: monthNames[month],
                income: monthlyData[key].income,
                expense: monthlyData[key].expense,
                date: new Date(year, month)
            };
        }).sort((a, b) => a.date.getTime() - b.date.getTime());

        return chartData;
    };

    // Fetch wallets
    const fetchWallets = async () => {
        try {
            const accounts = await walletService.getAccounts();
            const normalizedAccounts = accounts.map(account => ({
                ...account,
                balance: typeof account.balance === 'string' ? parseFloat(account.balance) : account.balance,
            }));
            setWallets(normalizedAccounts);
            setLoadingWallets(false);
        } catch (error) {
            console.error('Error fetching wallets:', error);
            setWallets([]);
            setLoadingWallets(false);
        }
    };

    useEffect(() => {
        if (!user) {
            setLoadingWallets(false);
            return;
        }
        fetchWallets();
    }, [user]);

    useEffect(() => {
        if (authLoading || !user || !user.email) {
            setLoadingInvoices(false);
            setLoadingDisputes(false);
            return;
        }

        const userDocRef = doc(db, "users", user.uid);
        const unsubUser = onSnapshot(userDocRef, async (doc) => {
            if (doc.exists()) {
                const data = doc.data();

                const newKycStatus = data.kycStatus;
                const normalizedKycStatus = typeof newKycStatus === 'string' ? newKycStatus.toLowerCase() : 'unverified';
                const welcomeNotificationSent = data.welcomeNotificationSent || {};

                const inferredHomeCurrency = (() => {
                    if (typeof data.homeCurrency === 'string' && data.homeCurrency) return data.homeCurrency;
                    if (typeof data.country === 'string' && data.country) {
                        return SUPPORTED_COUNTRIES.find((c) => c.iso2 === data.country)?.currency ?? null;
                    }
                    return null;
                })();

                setHomeCurrency(inferredHomeCurrency);
                setDefaultWalletCurrency(
                    (typeof data.defaultWalletCurrency === 'string' && data.defaultWalletCurrency) ? data.defaultWalletCurrency : inferredHomeCurrency
                );

                // Welcome notification logic for Personal
                if (normalizedKycStatus === 'verified' && !welcomeNotificationSent.personal && user.displayName) {
                    try {
                        const notificationsRef = collection(db, "users", user.uid, "notifications");
                        const existingNotifications = await getDocs(
                            query(notificationsRef, where("title", "==", "Account Verified!"), where("context", "==", "personal"))
                        );

                        if (existingNotifications.empty) {
                            await addDoc(notificationsRef, {
                                icon: 'kyc', title: 'Account Verified!',
                                description: 'Congratulations! Your account has been verified. You now have full access to all features.',
                                date: serverTimestamp(), read: false, href: '/dashboard/profile', context: 'personal'
                            });
                            await updateDoc(userDocRef, { 'welcomeNotificationSent.personal': true });
                        } else {
                            await updateDoc(userDocRef, { 'welcomeNotificationSent.personal': true });
                        }
                    } catch (error) {
                        console.error("Failed to send welcome notification:", error);
                    }
                }

                setIsKycVerified(normalizedKycStatus === 'verified');

                const transactions = data.transactions || [];
                if (transactions.length > 0) {
                    setHasTransactionData(true);
                    const monthlySummary = processTransactionsForChart(transactions);
                    setChartData(monthlySummary);
                    processTransactionsForSpending(transactions);
                } else {
                    setHasTransactionData(false);
                    setChartData([]);
                    setSpendingData(defaultSpendingData);
                }
            }
        },
            () => {
                const permissionError = new FirestorePermissionError({
                    path: userDocRef.path,
                    operation: 'get',
                });
                errorEmitter.emit('permission-error', permissionError);
            });

        const invoicesQuery = query(
            collection(db, "invoices"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc"),
            limit(4)
        );

        const unsubInvoices = onSnapshot(invoicesQuery, (snapshot) => {
            const fetchedInvoices: DocumentData[] = [];
            snapshot.forEach(doc => {
                fetchedInvoices.push({ id: doc.id, ...doc.data() });
            });
            setInvoices(fetchedInvoices);
            setLoadingInvoices(false);
        },
            (error) => {
                console.error("Error fetching invoices:", error);
                setLoadingInvoices(false);
            });

        const disputesQuery = query(collection(db, "disputes"), where("userId", "==", user.uid));
        const unsubDisputes = onSnapshot(disputesQuery, (snapshot) => {
            const fetchedDisputes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setDisputes(fetchedDisputes);
            setLoadingDisputes(false);
        }, (error) => {
            console.error("Error fetching disputes:", error);
            setLoadingDisputes(false);
        });

        return () => {
            unsubUser();
            unsubInvoices();
            unsubDisputes();
        };
    }, [user, authLoading]);

    useEffect(() => {
        let cancelled = false;

        const loadPinStatus = async () => {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                const res = await fetch('/api/security/pin/status', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error('Failed to load PIN status');
                const data = (await res.json()) as { hasPin?: boolean };
                const hasPin = Boolean(data?.hasPin);
                if (cancelled) return;
                setNeedsPin(!hasPin);
                setPinDialogOpen(!hasPin);
            } catch (err) {
                console.error('PIN status load error:', err);
                if (cancelled) return;
                // Fail open to avoid blocking the dashboard when the API is unavailable.
                setNeedsPin(false);
                setPinDialogOpen(false);
            }
        };

        void loadPinStatus();
        return () => {
            cancelled = true;
        };
    }, [user]);

    const refreshWallets = () => fetchWallets();

    return {
        user,
        authLoading,
        wallets,
        loadingWallets,
        isKycVerified,
        homeCurrency,
        defaultWalletCurrency,
        chartData,
        spendingData,
        hasTransactionData,
        invoices,
        loadingInvoices,
        disputes,
        loadingDisputes,
        needsPin,
        pinDialogOpen,
        setPinDialogOpen,
        refreshWallets,
        firstName: user?.displayName?.split(' ')[0] || "User"
    };
}
