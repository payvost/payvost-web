
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Ticket, Search, BarChart2, Edit, Link as LinkIcon } from 'lucide-react';
import { Input } from './ui/input';

const sampleEvents = [
  { id: 'EVT-001', name: 'Summer Music Festival', date: '2024-09-15', ticketsSold: 782, totalTickets: 1000, status: 'Live' },
  { id: 'EVT-002', name: 'Tech Conference 2024', date: '2024-10-20', ticketsSold: 450, totalTickets: 500, status: 'Live' },
  { id: 'EVT-003', name: 'Charity Gala Dinner', date: '2024-08-30', ticketsSold: 150, totalTickets: 150, status: 'Sold Out' },
  { id: 'EVT-004', name: 'Local Art Exhibition', date: '2024-09-05', ticketsSold: 0, totalTickets: 200, status: 'Draft' },
  { id: 'EVT-005', name: 'Indie Film Screening', date: '2024-07-28', ticketsSold: 88, totalTickets: 100, status: 'Completed' },
];

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  Live: 'default',
  'Sold Out': 'destructive',
  Draft: 'outline',
  Completed: 'secondary',
};

interface EventListViewProps {
    onFabClick: () => void;
}

export function EventListView({ onFabClick }: EventListViewProps) {
  const [events, setEvents] = useState(sampleEvents);

  if (events.length === 0) {
    return (
      <Card className="h-96">
        <CardContent className="flex flex-col items-center justify-center h-full text-center">
            <Ticket className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-2xl font-bold tracking-tight">You haven't created any events</h3>
            <p className="text-sm text-muted-foreground mb-6">Create your first event page to start selling tickets.</p>
            <Button onClick={onFabClick}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create First Event
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
            <CardTitle>Manage Events</CardTitle>
            <CardDescription>View, edit, and track your ticket sales.</CardDescription>
          </div>
          <Button onClick={onFabClick}><PlusCircle className="mr-2 h-4 w-4"/>Create New Event</Button>
        </div>
        <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search by event name..."
                className="w-full rounded-lg bg-background pl-8 md:w-[320px]"
            />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Tickets Sold</TableHead>
              <TableHead className="text-right">Status</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.name}</TableCell>
                <TableCell>{event.date}</TableCell>
                <TableCell>{event.ticketsSold} / {event.totalTickets}</TableCell>
                <TableCell className="text-right">
                    <Badge variant={statusVariant[event.status]}>{event.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem><BarChart2 className="mr-2 h-4 w-4"/>View Dashboard</DropdownMenuItem>
                            <DropdownMenuItem><Edit className="mr-2 h-4 w-4"/>Edit Event</DropdownMenuItem>
                            <DropdownMenuItem><LinkIcon className="mr-2 h-4 w-4"/>Copy Sales Link</DropdownMenuItem>
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
            Showing <strong>1-{events.length}</strong> of <strong>{events.length}</strong> events
        </div>
      </CardFooter>
    </Card>
  );
}
