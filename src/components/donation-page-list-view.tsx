
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Gift, Search, BarChart2, Edit, Link as LinkIcon, Loader2, Trash2 } from 'lucide-react';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, onSnapshot, DocumentData, deleteDoc, doc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, listAll, deleteObject } from "firebase/storage";
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';
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
  Active: 'default',
  Completed: 'secondary',
  Draft: 'outline',
};

interface DonationPageListViewProps {
    onFabClick: () => void;
    onEditClick: (campaignId: string) => void;
    isKycVerified: boolean;
}

export function DonationPageListView({ onFabClick, onEditClick, isKycVerified }: DonationPageListViewProps) {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<{id: string, title: string} | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const q = query(collection(db, "donations"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const campaignsData: DocumentData[] = [];
        querySnapshot.forEach((doc) => {
            campaignsData.push({ id: doc.id, ...doc.data() });
        });
        setCampaigns(campaignsData);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching campaigns: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);
  
  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
        title: "Link Copied",
        description: "The donation link has been copied to your clipboard.",
    });
  }
  
  const handleDelete = async () => {
    if (!campaignToDelete || !user) return;

    setIsDeleting(campaignToDelete.id);
    
    try {
        // 1. Delete all media from Firebase Storage first
        // It's safer to delete files first in case Firestore deletion fails.
        const campaignDoc = campaigns.find(c => c.id === campaignToDelete.id);
        if (campaignDoc) {
             const filesToDelete: string[] = [];
            if (campaignDoc.bannerImage) filesToDelete.push(campaignDoc.bannerImage);
            if (campaignDoc.gallery) filesToDelete.push(...campaignDoc.gallery);

            for (const fileUrl of filesToDelete) {
                try {
                    const fileRef = ref(storage, fileUrl);
                    await deleteObject(fileRef);
                } catch (storageError: any) {
                    // It's possible the file doesn't exist, so we log but don't fail the whole operation
                    if (storageError.code !== 'storage/object-not-found') {
                       console.error(`Failed to delete storage file ${fileUrl}:`, storageError);
                    }
                }
            }
        }
        
        // 2. Delete Firestore document
        await deleteDoc(doc(db, "donations", campaignToDelete.id));

        toast({
            title: "Campaign Deleted",
            description: `"${campaignToDelete.title}" has been permanently removed.`,
        });

    } catch (error) {
        console.error("Error deleting campaign:", error);
        toast({
            title: "Error",
            description: "Failed to delete the campaign. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsDeleting(null);
        setShowDeleteDialog(false);
        setCampaignToDelete(null);
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

  if (campaigns.length === 0) {
    return (
      <Card className="h-96">
        <CardContent className="flex flex-col items-center justify-center h-full text-center">
            <Gift className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-2xl font-bold tracking-tight">You haven't created any campaigns</h3>
            <p className="text-sm text-muted-foreground mb-6">Create your first campaign to start accepting donations.</p>
            <Button onClick={onFabClick} disabled={!isKycVerified}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Donation Campaign
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
            <CardTitle>Manage Campaigns</CardTitle>
            <CardDescription>View, edit, and track your fundraising campaigns.</CardDescription>
          </div>
          <Button onClick={onFabClick} disabled={!isKycVerified}><PlusCircle className="mr-2 h-4 w-4"/>Create New Campaign</Button>
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
            {campaigns.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.title}</TableCell>
                <TableCell>
                    <div className="flex flex-col gap-2">
                        <Progress value={(d.raisedAmount / d.goal) * 100} className="h-2" />
                        <span className="text-xs text-muted-foreground">${d.raisedAmount?.toLocaleString()} of ${d.goal?.toLocaleString()}</span>
                    </div>
                </TableCell>
                <TableCell className="text-right">
                    <Badge variant={statusVariant[d.status]}>{d.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={isDeleting === d.id}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem><BarChart2 className="mr-2 h-4 w-4"/>View Dashboard</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEditClick(d.id)}><Edit className="mr-2 h-4 w-4"/>Edit Campaign</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyLink(d.link)}><LinkIcon className="mr-2 h-4 w-4"/>Copy Donation Link</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onSelect={(e) => { e.preventDefault(); setCampaignToDelete({id: d.id, title: d.title}); setShowDeleteDialog(true);}}>
                                {isDeleting === d.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
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
            Showing <strong>1-{campaigns.length}</strong> of <strong>{campaigns.length}</strong> campaigns
        </div>
      </CardFooter>
    </Card>

    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the campaign
                <span className="font-semibold">"{campaignToDelete?.title}"</span> and all of its associated data and media.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
                 {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Confirm Deletion
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
