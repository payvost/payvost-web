
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Gift, Search, BarChart2, Edit, Link as LinkIcon } from 'lucide-react';
import { Input } from './ui/input';
import { Progress } from './ui/progress';

const sampleDonations = [
  { id: 'DON-001', name: 'Community Park Cleanup', raised: 1250, goal: 2000, status: 'Active' },
  { id: 'DON-002', name: 'Children\'s Hospital Toy Drive', raised: 5000, goal: 5000, status: 'Completed' },
  { id: 'DON-003', name: 'Animal Shelter Support Fund', raised: 850, goal: 1500, status: 'Active' },
  { id: 'DON-004', name: 'New Website Design', raised: 0, goal: 1000, status: 'Draft' },
  { id: 'DON-005', name: 'Emergency Relief Fund', raised: 10200, goal: 10000, status: 'Completed' },
];

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  Active: 'default',
  Completed: 'secondary',
  Draft: 'outline',
};

interface DonationPageListViewProps {
    onFabClick: () => void;
}

export function DonationPageListView({ onFabClick }: DonationPageListViewProps) {
  const [donations, setDonations] = useState(sampleDonations);

  if (donations.length === 0) {
    return (
      <Card className="h-96">
        <CardContent className="flex flex-col items-center justify-center h-full text-center">
            <Gift className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-2xl font-bold tracking-tight">You haven't created any campaigns</h3>
            <p className="text-sm text-muted-foreground mb-6">Create your first campaign to start accepting donations.</p>
            <Button onClick={onFabClick}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Donation Campaign
            </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Manage Campaigns</CardTitle>
            <CardDescription>View, edit, and track your fundraising campaigns.</CardDescription>
          </div>
          <Button onClick={onFabClick}><PlusCircle className="mr-2 h-4 w-4"/>Create New Campaign</Button>
        </div>
        <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search by campaign name..."
                className="w-full rounded-lg bg-background pl-8 md:w-[320px]"
            />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead className="text-right">Status</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {donations.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell>
                    <div className="flex flex-col gap-2">
                        <Progress value={(d.raised / d.goal) * 100} className="h-2" />
                        <span className="text-xs text-muted-foreground">${d.raised.toLocaleString()} of ${d.goal.toLocaleString()}</span>
                    </div>
                </TableCell>
                <TableCell className="text-right">
                    <Badge variant={statusVariant[d.status]}>{d.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem><BarChart2 className="mr-2 h-4 w-4"/>View Dashboard</DropdownMenuItem>
                            <DropdownMenuItem><Edit className="mr-2 h-4 w-4"/>Edit Campaign</DropdownMenuItem>
                            <DropdownMenuItem><LinkIcon className="mr-2 h-4 w-4"/>Copy Donation Link</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
       <CardFooter>
        <div className="text-xs text-muted-foreground">
            Showing <strong>1-{donations.length}</strong> of <strong>{donations.length}</strong> campaigns
        </div>
      </CardFooter>
    </Card>
  );
}
