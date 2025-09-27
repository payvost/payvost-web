
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Monitor, Smartphone, Globe, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

type TransactionStatus = 'success' | 'processing' | 'failed';
type RiskLevel = 'low' | 'medium' | 'high';
type DeviceType = 'desktop' | 'mobile';

interface RealTimeTransaction {
  id: string;
  user: string;
  email: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  risk: RiskLevel;
  location: string;
  ip: string;
  device: DeviceType;
  timestamp: Date;
}

const initialTransactions: RealTimeTransaction[] = [
    { id: 'txn_1a2b3c', user: 'Alice', email: 'alice@example.com', amount: 150.00, currency: 'USD', status: 'success', risk: 'low', location: 'US', ip: '192.168.1.1', device: 'desktop', timestamp: new Date() },
    { id: 'txn_4d5e6f', user: 'Bob', email: 'bob@example.com', amount: 75.50, currency: 'EUR', status: 'processing', risk: 'medium', location: 'DE', ip: '198.51.100.2', device: 'mobile', timestamp: new Date(Date.now() - 2000) },
    { id: 'txn_7g8h9i', user: 'Charlie', email: 'charlie@example.com', amount: 320.00, currency: 'GBP', status: 'failed', risk: 'high', location: 'GB', ip: '203.0.113.5', device: 'desktop', timestamp: new Date(Date.now() - 5000) },
];

const statusConfig: Record<TransactionStatus, { icon: React.ReactNode; color: string; label: string }> = {
    success: { icon: <CheckCircle className="h-4 w-4 text-green-500" />, color: 'bg-green-500/10 text-green-700 dark:text-green-400', label: 'Success' },
    processing: { icon: <Clock className="h-4 w-4 text-amber-500" />, color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', label: 'Processing' },
    failed: { icon: <AlertCircle className="h-4 w-4 text-red-500" />, color: 'bg-red-500/10 text-red-700 dark:text-red-400', label: 'Failed' },
};

const riskConfig: Record<RiskLevel, { color: string; label: string }> = {
    low: { color: 'bg-green-500/20 text-green-800 dark:text-green-300', label: 'Low' },
    medium: { color: 'bg-amber-500/20 text-amber-800 dark:text-amber-300', label: 'Medium' },
    high: { color: 'bg-red-500/20 text-red-800 dark:text-red-300', label: 'High' },
};

export default function RealTimePage() {
    const [transactions, setTransactions] = useState<RealTimeTransaction[]>(initialTransactions);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            const newTx: RealTimeTransaction = {
                id: `txn_${Math.random().toString(36).substring(2, 8)}`,
                user: ['David', 'Eve', 'Frank', 'Grace'][Math.floor(Math.random() * 4)],
                email: `user${Math.floor(Math.random()*100)}@example.com`,
                amount: parseFloat((Math.random() * 500).toFixed(2)),
                currency: ['USD', 'EUR', 'GBP', 'NGN'][Math.floor(Math.random() * 4)],
                status: (['success', 'processing', 'failed'] as TransactionStatus[])[Math.floor(Math.random() * 3)],
                risk: (['low', 'medium', 'high'] as RiskLevel[])[Math.floor(Math.random() * 3)],
                location: ['CA', 'NG', 'IN', 'BR'][Math.floor(Math.random() * 4)],
                ip: `10.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
                device: (['desktop', 'mobile'] as DeviceType[])[Math.floor(Math.random() * 2)],
                timestamp: new Date(),
            };
            setTransactions(prev => [newTx, ...prev].slice(0, 20)); // Keep the list to a manageable size
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const filteredTransactions = transactions.filter(tx => 
        tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.ip.includes(searchTerm)
    );

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Real-Time Transactions</h2>
                    <p className="text-muted-foreground">A live feed of all transactions happening on your platform.</p>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Live Feed</CardTitle>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by ID, email, IP..." 
                                className="pl-10" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Status</TableHead>
                                <TableHead>Transaction</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Risk Score</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence initial={false}>
                                {filteredTransactions.map((tx) => (
                                    <motion.tr
                                        key={tx.id}
                                        layout
                                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        transition={{ duration: 0.5, ease: "easeInOut" }}
                                        className="text-sm"
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {statusConfig[tx.status].icon}
                                                <span className="hidden md:inline">{statusConfig[tx.status].label}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{tx.id}</div>
                                            <div className="text-xs text-muted-foreground">{tx.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-mono">{new Intl.NumberFormat('en-US', { style: 'currency', currency: tx.currency }).format(tx.amount)}</div>
                                            <div className="text-xs text-muted-foreground">{tx.currency}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <img src={`/flags/${tx.location.toUpperCase()}.png`} alt={tx.location} className="h-4 w-6 object-cover rounded-sm"/>
                                                <span>{tx.ip}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge className={cn("capitalize", riskConfig[tx.risk].color)}>{riskConfig[tx.risk].label}</Badge>
                                                {tx.device === 'desktop' ? <Monitor className="h-4 w-4 text-muted-foreground" /> : <Smartphone className="h-4 w-4 text-muted-foreground" />}
                                            </div>
                                        </TableCell>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                    {filteredTransactions.length === 0 && (
                        <div className="text-center p-8 text-muted-foreground">
                            <p>No transactions match your search.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
