
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { useEffect, useState } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Skeleton } from "./ui/skeleton"

export function RecentTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        const sortedTransactions = (userData.transactions || []).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(sortedTransactions.slice(0, 5)); // Get latest 5
      }
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const formatCurrency = (amount: string, currency: string) => {
    const numericAmount = parseFloat(amount.replace(/[^0-9.-]+/g,""));
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(numericAmount);
  };


  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            An overview of your latest transfers.
          </CardDescription>
        </div>
        <Button asChild size="sm" className="ml-auto gap-1">
          <Link href="/dashboard/transactions">
            View All
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
                <TableRow key={tx.id}>
                  <TableCell>
                    <div className="font-medium">{tx.recipientName || tx.recipient}</div>
                    <div className="text-sm text-muted-foreground hidden md:inline">{tx.sendCurrency}</div>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(tx.sendAmount, tx.sendCurrency)}</TableCell>
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
                  <TableCell className="hidden text-right md:table-cell">{new Date(tx.date).toLocaleDateString()}</TableCell>
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
  )
}
