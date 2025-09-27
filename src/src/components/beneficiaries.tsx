
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlusCircle, Send, MoreVertical, Edit, Trash2 } from "lucide-react";
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

const initialBeneficiaries = [
  { name: 'John Doe', country: 'USA', avatar: 'https://placehold.co/100x100.png', hint: 'man portrait', bankName: 'Chase Bank', accountLast4: '9876' },
  { name: 'Jane Smith', country: 'UK', avatar: 'https://placehold.co/100x100.png', hint: 'woman portrait', bankName: 'Barclays', accountLast4: '5432' },
  { name: 'Pierre Dupont', country: 'France', avatar: 'https://placehold.co/100x100.png', hint: 'person portrait', bankName: 'BNP Paribas', accountLast4: '8765' },
  { name: 'Adebayo Adekunle', country: 'Nigeria', avatar: 'https://placehold.co/100x100.png', hint: 'man smiling', bankName: 'GTBank', accountLast4: '4321' },
];

export function Beneficiaries() {
  const [beneficiaries, setBeneficiaries] = useState(initialBeneficiaries);
  const [open, setOpen] = useState(false);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Beneficiaries</CardTitle>
        <CardDescription>Your saved recipients.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-[300px] px-6">
          <div className="space-y-4">
            {beneficiaries.map((b, index) => (
              <div key={index} className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={b.avatar} data-ai-hint={b.hint} />
                  <AvatarFallback>{getInitials(b.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{b.name}</p>
                  <p className="text-xs text-muted-foreground">{b.bankName} •••• {b.accountLast4}</p>
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
            <DialogHeader>
              <DialogTitle>Add New Beneficiary</DialogTitle>
              <DialogDescription>
                Save recipient details for faster transfers.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" placeholder="United States" />
              </div>
               <div className="space-y-2">
                <Label htmlFor="bank">Bank</Label>
                <Input id="bank" placeholder="Chase Bank" />
              </div>
               <div className="space-y-2">
                <Label htmlFor="account">Account Number</Label>
                <Input id="account" placeholder="1234567890" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => setOpen(false)}>Save Beneficiary</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
