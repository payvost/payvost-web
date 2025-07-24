
'use client';

import {
  Activity,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Users,
  ShieldAlert,
  TrendingUp,
  User,
  Briefcase,
  Rocket,
  Landmark,
  Sun,
  Moon,
} from 'lucide-react';

import Link from 'next/link';
import { useState, useEffect } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AdminTransactionOverviewChart } from '@/components/admin-transaction-overview-chart';

const kpiCards = [
    { title: "Total Processed Payments", value: "$4,259,231.89", change: "+20.1% from last month", icon: <DollarSign className="h-4 w-4 text-muted-foreground" /> },
    { title: "Active Users", value: "+2,350", change: "+180.1% from last month", icon: <Users className="h-4 w-4 text-muted-foreground" /> },
    { title: "Flagged Transactions", value: "12", change: "+19% from last month", icon: <ShieldAlert className="h-4 w-4 text-muted-foreground" /> },
    { title: "Today's Revenue", value: "$12,573.02", change: "+201 since last hour", icon: <TrendingUp className="h-4 w-4 text-muted-foreground" /> },
];

const recentTransactions = [
    { user: 'Liam Johnson', email: 'liam@example.com', type: 'Sale', status: 'Approved', date: '2023-06-23', amount: '$250.00' },
    { user: 'Olivia Smith', email: 'olivia@example.com', type: 'Refund', status: 'Declined', date: '2023-06-24', amount: '$150.00' },
    { user: 'Noah Williams', email: 'noah@example.com', type: 'Subscription', status: 'Approved', date: '2023-06-25', amount: '$350.00' },
    { user: 'Emma Brown', email: 'emma@example.com', type: 'Sale', status: 'Approved', date: '2023-06-26', amount: '$450.00' },
    { user: 'Liam Johnson', email: 'liam@example.com', type: 'Sale', status: 'Approved', date: '2023-06-27', amount: '$550.00' },
];

const newSignupsByCategory = [
    { 
        category: 'Users', 
        count: 184, 
        icon: <User className="h-5 w-5 text-muted-foreground" />
    },
    { 
        category: 'Businesses', 
        count: 62, 
        icon: <Briefcase className="h-5 w-5 text-muted-foreground" /> 
    },
    { 
        category: 'Founders', 
        count: 15, 
        icon: <Rocket className="h-5 w-5 text-muted-foreground" />
    },
    { 
        category: 'VCs', 
        count: 4, 
        icon: <Landmark className="h-5 w-5 text-muted-foreground" />
    }
];

interface GreetingState {
    text: string;
    icon: React.ReactNode;
}

export default function Dashboard() {
  const [greeting, setGreeting] = useState<GreetingState | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting({ text: "Good Morning", icon: <Sun className="h-8 w-8 text-yellow-500" /> });
    } else if (hour < 18) {
      setGreeting({ text: "Good Afternoon", icon: <Sun className="h-8 w-8 text-orange-500" /> });
    } else {
      setGreeting({ text: "Good Evening", icon: <Moon className="h-8 w-8 text-blue-400" /> });
    }
  }, []);

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center gap-2">
            {greeting?.icon}
            <div>
                 <h2 className="text-3xl font-bold tracking-tight">
                    {greeting ? `${greeting.text}, Boss!` : 'Welcome, Boss!'}
                 </h2>
                 <p className="text-muted-foreground">Welcome to the Admin Panel.</p>
            </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map(card => (
            <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                    {card.icon}
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <p className="text-xs text-muted-foreground">{card.change}</p>
                </CardContent>
            </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Transaction Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
             <AdminTransactionOverviewChart />
          </CardContent>
        </Card>
        <Card className="col-span-3 flex flex-col">
          <CardHeader>
            <CardTitle>New Sign-ups</CardTitle>
            <CardDescription>
              265 new sign-ups this month across all categories.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
             <div className="space-y-6">
                {newSignupsByCategory.map(item => (
                    <div className="flex items-center" key={item.category}>
                       <div className="p-3 bg-muted rounded-full">
                         {item.icon}
                       </div>
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">{item.category}</p>
                            <p className="text-sm text-muted-foreground">{item.count} new sign-ups</p>
                        </div>
                        <div className="ml-auto font-medium text-lg">{item.count}</div>
                    </div>
                ))}
            </div>
          </CardContent>
           <CardFooter>
              <Button asChild className="w-full">
                <Link href="/admin-panel/dashboard/customers">
                    View All Users
                </Link>
            </Button>
           </CardFooter>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Recent transactions from your store.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {recentTransactions.map(tx => (
                    <TableRow key={tx.email + tx.date}>
                        <TableCell>
                            <div className="font-medium">{tx.user}</div>
                            <div className="hidden text-sm text-muted-foreground md:inline">
                                {tx.email}
                            </div>
                        </TableCell>
                         <TableCell className="hidden sm:table-cell">{tx.type}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                             <Badge className="text-xs" variant={tx.status === 'Approved' ? 'default' : 'destructive'}>
                                {tx.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{tx.date}</TableCell>
                        <TableCell className="text-right">{tx.amount}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
