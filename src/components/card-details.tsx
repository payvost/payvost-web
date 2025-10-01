
'use client';

import type { VirtualCardData } from '@/types/virtual-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { VirtualCard } from './virtual-card';
import { Button } from './ui/button';
import { DollarSign, FileDown, Settings, Snowflake } from 'lucide-react';
import { Progress } from './ui/progress';

interface CardDetailsProps {
    card: VirtualCardData;
}

export function CardDetails({ card }: CardDetailsProps) {
    const isCredit = card.cardModel === 'credit';
    const spent = card.transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const limit = card.spendingLimit?.amount ?? 0;
    
    // For credit cards, progress shows credit used. For debit, it shows balance spent from limit.
    const progressValue = isCredit 
        ? (card.balance / limit) * -100 // balance is negative for credit spent
        : limit > 0 ? (spent / limit) * 100 : 0;
    
    const limitText = isCredit 
        ? `Credit Limit: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: card.currency }).format(limit)}`
        : `Monthly limit of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: card.currency }).format(limit)}`;
    
    const spentText = isCredit
        ? `${new Intl.NumberFormat('en-US', { style: 'currency', currency: card.currency }).format(Math.abs(card.balance))} used`
        : `${new Intl.NumberFormat('en-US', { style: 'currency', currency: card.currency }).format(spent)} spent`;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-1 space-y-6">
                <VirtualCard card={card} />
                <Card>
                    <CardHeader>
                        <CardTitle>Card Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <Button variant="outline"><DollarSign className="mr-2 h-4 w-4"/> {isCredit ? 'Pay Bill' : 'Top Up'}</Button>
                        <Button variant="outline"><Snowflake className="mr-2 h-4 w-4"/> Freeze</Button>
                        <Button variant="outline"><Settings className="mr-2 h-4 w-4"/> Settings</Button>
                        <Button variant="outline"><FileDown className="mr-2 h-4 w-4"/> Statement</Button>
                    </CardContent>
                </Card>
                 {card.spendingLimit && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Spending Limit</CardTitle>
                            <CardDescription>
                               {limitText}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <Progress value={progressValue} className="mb-2" />
                           <p className="text-sm text-muted-foreground">
                            {spentText}
                           </p>
                        </CardContent>
                    </Card>
                )}
            </div>
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Transaction History</CardTitle>
                        <CardDescription>Recent transactions made with this card.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {card.transactions.length > 0 ? (
                                    card.transactions.map(tx => (
                                        <TableRow key={tx.id}>
                                            <TableCell className="font-medium">{tx.description}</TableCell>
                                            <TableCell>{tx.date}</TableCell>
                                            <TableCell className="text-right font-mono">{new Intl.NumberFormat('en-US', { style: 'currency', currency: card.currency }).format(tx.amount)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">No transactions yet.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
