
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlusCircle, Send, MoreVertical, Edit, Trash2, Loader2, Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { ScrollArea } from './ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import Image from 'next/image';


const beneficiarySchema = z.object({
  name: z.string().min(2, "Name is required"),
  country: z.string().min(1, "Country is required"),
  bank: z.string().min(1, "Bank is required"),
  accountNumber: z.string().min(5, "Account number is required"),
});

type BeneficiaryFormValues = z.infer<typeof beneficiarySchema>;


const countryBankData: Record<string, string[]> = {
    USA: ['Chase Bank', 'Bank of America', 'Wells Fargo'],
    NGA: ['Guaranty Trust Bank', 'Zenith Bank', 'Access Bank'],
    GBR: ['Barclays', 'HSBC', 'Lloyds Bank'],
    GHA: ['GCB Bank', 'Ecobank Ghana', 'Fidelity Bank'],
};

const countryFlags: Record<string, string> = {
    USA: 'us',
    NGA: 'ng',
    GBR: 'gb',
    GHA: 'gh',
};

interface BeneficiariesProps {
  onSelectBeneficiary?: (beneficiaryId: string) => void;
}

export function Beneficiaries({ onSelectBeneficiary }: BeneficiariesProps) {
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<any>(null);
  const [deletingBeneficiary, setDeletingBeneficiary] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { register, handleSubmit, control, watch, reset, formState: { errors }, setValue } = useForm<BeneficiaryFormValues>({
    resolver: zodResolver(beneficiarySchema),
  });

  const selectedCountry = watch('country');
  const banks = selectedCountry ? countryBankData[selectedCountry] : [];

  // Filter beneficiaries based on search
  const filteredBeneficiaries = useMemo(() => {
    if (!searchQuery.trim()) return beneficiaries;
    const query = searchQuery.toLowerCase();
    return beneficiaries.filter(b => 
      b.name?.toLowerCase().includes(query) ||
      b.bank?.toLowerCase().includes(query) ||
      b.accountLast4?.includes(query)
    );
  }, [beneficiaries, searchQuery]);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    }
    const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
        if (doc.exists()) {
            setBeneficiaries(doc.data().beneficiaries || []);
        }
        setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const getInitials = (name: string) => {
    if (!name) return "";
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleEdit = (beneficiary: any) => {
    setEditingBeneficiary(beneficiary);
    setValue('name', beneficiary.name);
    setValue('country', beneficiary.country);
    setValue('bank', beneficiary.bank);
    setValue('accountNumber', beneficiary.accountNumber);
    setEditOpen(true);
  };

  const handleDelete = (beneficiary: any) => {
    setDeletingBeneficiary(beneficiary);
    setDeleteOpen(true);
  };

  const onDelete = async () => {
    if (!user || !deletingBeneficiary) return;
    
    setIsDeleting(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        beneficiaries: arrayRemove(deletingBeneficiary)
      });
      toast({
        title: "Beneficiary Deleted",
        description: `${deletingBeneficiary.name} has been removed from your beneficiaries.`
      });
      setDeleteOpen(false);
      setDeletingBeneficiary(null);
    } catch (error) {
      console.error("Failed to delete beneficiary:", error);
      toast({
        title: "Error",
        description: "Could not delete the beneficiary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const onEdit = async (data: BeneficiaryFormValues) => {
    if (!user || !editingBeneficiary) return;
    
    setIsSubmitting(true);
    try {
      const updatedBeneficiary = {
        ...editingBeneficiary,
        ...data,
        accountLast4: data.accountNumber.slice(-4),
      };
      
      // Remove old and add updated
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        beneficiaries: arrayRemove(editingBeneficiary)
      });
      await updateDoc(userDocRef, {
        beneficiaries: arrayUnion(updatedBeneficiary)
      });
      
      toast({
        title: "Beneficiary Updated",
        description: `${data.name}'s details have been updated.`
      });
      setEditOpen(false);
      setEditingBeneficiary(null);
      reset();
    } catch (error) {
      console.error("Failed to update beneficiary:", error);
      toast({
        title: "Error",
        description: "Could not update the beneficiary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const onSubmit = async (data: BeneficiaryFormValues) => {
    if (!user) {
        toast({ title: "Error", description: "You must be logged in to add a beneficiary.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    try {
        const newBeneficiary = {
            ...data,
            id: `ben_${Date.now()}`,
            accountLast4: data.accountNumber.slice(-4),
        };
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
            beneficiaries: arrayUnion(newBeneficiary)
        });
        toast({
            title: "Beneficiary Saved",
            description: `${data.name} has been added to your beneficiaries.`
        });
        setOpen(false);
        reset();
    } catch (error) {
        console.error("Failed to save beneficiary:", error);
        toast({
            title: "Error",
            description: "Could not save the beneficiary. Please try again.",
            variant: "destructive",
        })
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleSend = (beneficiaryId: string) => {
    if (onSelectBeneficiary) {
      onSelectBeneficiary(beneficiaryId);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Beneficiaries</CardTitle>
        <CardDescription>Your saved recipients.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        {/* Search Bar */}
        {beneficiaries.length > 0 && (
          <div className="px-6 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search beneficiaries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
        
        <ScrollArea className="h-[300px] px-6">
          <div className="space-y-3">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="h-12 w-12 rounded-full bg-muted"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : filteredBeneficiaries.length === 0 ? (
              <div className="text-center py-10">
                {searchQuery ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-2">No beneficiaries found</p>
                    <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
                      Clear search
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <PlusCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">No beneficiaries saved yet.</p>
                    <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add your first beneficiary
                    </Button>
                  </>
                )}
              </div>
            ) : (
              filteredBeneficiaries.map((b, index) => (
                <div 
                  key={b.id || index} 
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={b.avatar || `https://i.pravatar.cc/150?u=${b.email}`} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(b.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{b.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {b.country && countryFlags[b.country] && (
                        <Image
                          src={`/flag/${countryFlags[b.country]}.png`}
                          alt={b.country}
                          width={16}
                          height={16}
                          className="rounded-full object-cover"
                        />
                      )}
                      <p className="text-xs text-muted-foreground truncate">
                        {b.bank} •••• {b.accountLast4}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="h-8"
                      onClick={() => handleSend(b.id)}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Send
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(b)}>
                          <Edit className="mr-2 h-4 w-4"/>Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDelete(b)}
                        >
                          <Trash2 className="mr-2 h-4 w-4"/>Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Beneficiary
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogHeader>
                <DialogTitle>Add New Beneficiary</DialogTitle>
                <DialogDescription>
                    Save recipient details for faster transfers.
                </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" {...register('name')} placeholder="John Doe" />
                    {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Controller
                        name="country"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger id="country">
                                    <SelectValue placeholder="Select a country" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USA">United States</SelectItem>
                                    <SelectItem value="NGA">Nigeria</SelectItem>
                                    <SelectItem value="GBR">United Kingdom</SelectItem>
                                    <SelectItem value="GHA">Ghana</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                     {errors.country && <p className="text-destructive text-sm">{errors.country.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="bank">Bank</Label>
                    <Controller
                        name="bank"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedCountry}>
                                <SelectTrigger id="bank">
                                    <SelectValue placeholder={selectedCountry ? "Select a bank" : "Select a country first"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {banks.map(bank => (
                                        <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.bank && <p className="text-destructive text-sm">{errors.bank.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="account">Account Number</Label>
                    <Input id="account" {...register('accountNumber')} placeholder="1234567890" />
                    {errors.accountNumber && <p className="text-sm text-destructive">{errors.accountNumber.message}</p>}
                </div>
                </div>
                <DialogFooter>
                <Button variant="ghost" type="button" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Save Beneficiary
                </Button>
                </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <form onSubmit={handleSubmit(onEdit)}>
              <DialogHeader>
                <DialogTitle>Edit Beneficiary</DialogTitle>
                <DialogDescription>
                  Update recipient details.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input id="edit-name" {...register('name')} placeholder="John Doe" />
                  {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-country">Country</Label>
                  <Controller
                    name="country"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="edit-country">
                          <SelectValue placeholder="Select a country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USA">United States</SelectItem>
                          <SelectItem value="NGA">Nigeria</SelectItem>
                          <SelectItem value="GBR">United Kingdom</SelectItem>
                          <SelectItem value="GHA">Ghana</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.country && <p className="text-destructive text-sm">{errors.country.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-bank">Bank</Label>
                  <Controller
                    name="bank"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCountry}>
                        <SelectTrigger id="edit-bank">
                          <SelectValue placeholder={selectedCountry ? "Select a bank" : "Select a country first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {banks.map(bank => (
                            <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.bank && <p className="text-destructive text-sm">{errors.bank.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-account">Account Number</Label>
                  <Input id="edit-account" {...register('accountNumber')} placeholder="1234567890" />
                  {errors.accountNumber && <p className="text-sm text-destructive">{errors.accountNumber.message}</p>}
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" type="button" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                  Update Beneficiary
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Beneficiary?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove {deletingBeneficiary?.name} from your beneficiaries? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
