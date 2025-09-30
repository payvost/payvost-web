
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlusCircle, Send, MoreVertical, Edit, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { doc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';


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

export function Beneficiaries() {
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<BeneficiaryFormValues>({
    resolver: zodResolver(beneficiarySchema),
  });

  const selectedCountry = watch('country');
  const banks = selectedCountry ? countryBankData[selectedCountry] : [];

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


  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Beneficiaries</CardTitle>
        <CardDescription>Your saved recipients.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-[300px] px-6">
          <div className="space-y-4">
            {loading ? [...Array(3)].map((_, i) => <div key={i} className="flex items-center gap-4 animate-pulse"><div className="h-10 w-10 rounded-full bg-muted"></div><div className="flex-1 space-y-2"><div className="h-4 bg-muted rounded w-3/4"></div><div className="h-3 bg-muted rounded w-1/2"></div></div></div>)
             : beneficiaries.length === 0 ? <p className="text-sm text-muted-foreground text-center py-10">No beneficiaries saved yet.</p>
             : beneficiaries.map((b, index) => (
              <div key={b.id || index} className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={b.avatar || `https://i.pravatar.cc/150?u=${b.email}`} data-ai-hint="person portrait" />
                  <AvatarFallback>{getInitials(b.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{b.name}</p>
                  <p className="text-xs text-muted-foreground">{b.bank} •••• {b.accountLast4}</p>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-8">
                        <Send className="h-4 w-4 mr-2" /> Send
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem><Edit className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              </div>
            ))}
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
      </CardFooter>
    </Card>
  );
}
