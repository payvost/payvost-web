
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Skeleton } from "./ui/skeleton";

type DashboardTransaction = {
  id?: string;
  recipientName?: string;
  recipient?: string;
  sendAmount: string;
  sendCurrency: string;
  status?: string;
  date: string;
};

export function RecentTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        const normalized: DashboardTransaction[] = (userData.transactions || []).map((tx: DashboardTransaction, index: number) => ({
          id: tx.id ?? `${index}`,
          recipientName: tx.recipientName ?? tx.recipient,
          recipient: tx.recipient,
          sendAmount: typeof tx.sendAmount === 'string' ? tx.sendAmount : String(tx.sendAmount ?? '0'),
          sendCurrency: tx.sendCurrency || 'USD',
          status: tx.status || 'Pending',
          date: tx.date || new Date().toISOString(),
        }));
        const sortedTransactions = normalized.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(sortedTransactions.slice(0, 5));
      }
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const formatCurrency = (amount: string, currency: string) => {
    const numericAmount = parseFloat(String(amount).replace(/[^0-9.-]+/g,""));
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        currencyDisplay: 'narrowSymbol',
    }).format(numericAmount);
  };

  return (
    <Card className="border-muted-foreground/15 shadow-sm">
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-1">
          <CardTitle className="text-sm font-semibold">Recent activity</CardTitle>
          <CardDescription className="text-xs">Live feed of your last five transactions.</CardDescription>
        </div>
        <Badge variant="secondary" className="ml-auto mr-2 text-[11px]">Live</Badge>
        <Button asChild size="sm" className="gap-1">
          <Link href="/dashboard/transactions">
            View all
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recipient</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Status</TableHead>
              <TableHead className="hidden text-right md:table-cell">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : transactions.length > 0 ? (
              transactions.map((tx) => (
                <TableRow key={tx.id} className="hover:bg-muted/40">
                  <TableCell>
                    <div className="font-medium">{tx.recipientName || tx.recipient}</div>
                    <div className="text-xs text-muted-foreground hidden md:inline">{tx.sendCurrency}</div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatCurrency(tx.sendAmount, tx.sendCurrency)}</TableCell>
                  <TableCell className="hidden text-right sm:table-cell">
                    <Badge 
                      variant={
                        tx.status === 'Completed' ? 'default' : 
                        tx.status === 'Pending' ? 'secondary' : 'destructive'
                      }
                      className="capitalize"
                    >
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-right md:table-cell text-sm text-muted-foreground">
                    {new Date(tx.date).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        No recent transactions.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
