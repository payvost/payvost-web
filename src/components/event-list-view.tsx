
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Ticket, Search, BarChart2, Edit, Link as LinkIcon, Copy, Trash2, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, onSnapshot, DocumentData, deleteDoc, doc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, deleteObject } from "firebase/storage";
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  Live: 'default',
  'Sold Out': 'destructive',
  Draft: 'outline',
  Completed: 'secondary',
};

interface EventListViewProps {
    onFabClick: () => void;
    onEditClick: (eventId: string) => void;
}

export function EventListView({ onFabClick, onEditClick }: EventListViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<{id: string, title: string} | null>(null);
  
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const q = query(collection(db, "events"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const eventsData: DocumentData[] = [];
        querySnapshot.forEach((doc) => {
            eventsData.push({ id: doc.id, ...doc.data() });
        });
        setEvents(eventsData);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching events: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
        title: "Link Copied",
        description: "The public event link has been copied to your clipboard.",
    });
  }

  const handleDelete = async () => {
    if (!eventToDelete || !user) return;

    setIsDeleting(eventToDelete.id);
    
    try {
        const eventDoc = events.find(c => c.id === eventToDelete.id);
        if (eventDoc && eventDoc.bannerImage) {
            try {
                const fileRef = ref(storage, eventDoc.bannerImage);
                await deleteObject(fileRef);
            } catch (storageError: any) {
                if (storageError.code !== 'storage/object-not-found') {
                    console.error(`Failed to delete banner image ${eventDoc.bannerImage}:`, storageError);
                }
            }
        }
        
        await deleteDoc(doc(db, "events", eventToDelete.id));

        toast({
            title: "Event Deleted",
            description: `"${eventToDelete.title}" has been permanently removed.`,
        });

    } catch (error) {
        console.error("Error deleting event:", error);
        toast({
            title: "Error",
            description: "Failed to delete the event. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsDeleting(null);
        setShowDeleteDialog(false);
        setEventToDelete(null);
    }
  };


  if (loading) {
    return (
        <Card>
            <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
            </CardContent>
        </Card>
    );
  }

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
    <>
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
                <TableCell className="font-medium">{event.eventName}</TableCell>
                <TableCell>{event.eventDate.toDate().toLocaleDateString()}</TableCell>
                <TableCell>0 / {event.tickets.reduce((acc: number, t: any) => acc + t.quantity, 0)}</TableCell>
                <TableCell className="text-right">
                    <Badge variant={statusVariant['Live']}>Live</Badge>
                </TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={isDeleting === event.id}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild><Link href={`/event/${event.id}/stats`}><BarChart2 className="mr-2 h-4 w-4"/>View Stats</Link></DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEditClick(event.id)}><Edit className="mr-2 h-4 w-4"/>Edit Event</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyLink(event.publicLink)}><Copy className="mr-2 h-4 w-4"/>Copy Public Sales Link</DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <DropdownMenuItem className="text-destructive" onSelect={(e) => { e.preventDefault(); setEventToDelete({id: event.id, title: event.eventName}); setShowDeleteDialog(true);}}>
                                {isDeleting === event.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                                Delete
                            </DropdownMenuItem>
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

     <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the event
                <span className="font-semibold">"{eventToDelete?.title}"</span> and all of its associated data and media.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={!!isDeleting}>
                 {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Confirm Deletion
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
