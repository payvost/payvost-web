'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Search,
    UserPlus,
    User,
    Mail,
    Phone,
    Landmark,
    Trash2,
    Plus,
    MoreVertical,
    Banknote,
    Users
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { recipientService, Recipient } from '@/services/recipientService';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function RecipientsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddingRecipient, setIsAddingRecipient] = useState(false);
    const [isEditingRecipient, setIsEditingRecipient] = useState(false);
    const [editingRecipientId, setEditingRecipientId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    // New Recipient Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        bankName: '',
        accountNumber: '',
        swiftCode: '',
        currency: 'USD',
        country: '',
    });

    const [editFormData, setEditFormData] = useState({
        name: '',
        email: '',
        phone: '',
        bankName: '',
        accountNumber: '',
        swiftCode: '',
        currency: 'USD',
        country: '',
    });

    useEffect(() => {
        fetchRecipients();
    }, [user]);

    const fetchRecipients = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await recipientService.list();
            setRecipients(data);
        } catch (error) {
            console.error('Error fetching recipients:', error);
            toast({
                title: 'Error',
                description: 'Failed to load recipients.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRecipient = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await recipientService.create({ ...formData, type: 'EXTERNAL' });
            toast({
                title: 'Success',
                description: 'Recipient added successfully.',
            });
            setIsAddingRecipient(false);
            setFormData({
                name: '',
                email: '',
                phone: '',
                bankName: '',
                accountNumber: '',
                swiftCode: '',
                currency: 'USD',
                country: '',
            });
            fetchRecipients();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to add recipient.',
                variant: 'destructive',
            });
        }
    };

    const openEditRecipient = (recipient: Recipient) => {
        setEditingRecipientId(recipient.id);
        setEditFormData({
            name: recipient.name || '',
            email: recipient.email || '',
            phone: recipient.phone || '',
            bankName: recipient.bankName || '',
            accountNumber: recipient.accountNumber || '',
            swiftCode: recipient.swiftCode || '',
            currency: recipient.currency || 'USD',
            country: recipient.country || '',
        });
        setIsEditingRecipient(true);
    };

    const handleUpdateRecipient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRecipientId) return;
        try {
            await recipientService.update(editingRecipientId, editFormData);
            toast({
                title: 'Success',
                description: 'Recipient updated successfully.',
            });
            setIsEditingRecipient(false);
            setEditingRecipientId(null);
            fetchRecipients();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update recipient.',
                variant: 'destructive',
            });
        }
    };

    const handleDeleteRecipient = async (id: string) => {
        setIsDeleting(id);
        try {
            await recipientService.delete(id);
            toast({
                title: 'Success',
                description: 'Recipient removed successfully.',
            });
            fetchRecipients();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete recipient.',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(null);
        }
    };

    const filteredRecipients = recipients.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.email && r.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <>
            <main className="flex-1 flex flex-col gap-4 p-4 sm:p-5 lg:gap-6 lg:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-base font-semibold sm:text-lg md:text-2xl">Address Book</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Manage your saved beneficiaries for quick transfers.</p>
                    </div>

                    <Dialog open={isAddingRecipient} onOpenChange={setIsAddingRecipient}>
                        <DialogTrigger asChild>
                            <Button size="lg" className="bg-primary hover:bg-primary/90">
                                <UserPlus className="mr-2 h-5 w-5" /> Add New Recipient
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <form onSubmit={handleCreateRecipient}>
                                <DialogHeader>
                                    <DialogTitle>Add New Recipient</DialogTitle>
                                    <DialogDescription>
                                        Enter the details of the person or business you want to save.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g. John Doe"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="email">Email (Optional)</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="john@example.com"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="phone">Phone (Optional)</Label>
                                            <Input
                                                id="phone"
                                                placeholder="+1 234 567 8900"
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <Separator className="my-2" />
                                    <p className="text-sm font-medium text-muted-foreground">Bank Details (Optional)</p>

                                    <div className="grid gap-2">
                                        <Label htmlFor="bankName">Bank Name</Label>
                                        <Input
                                            id="bankName"
                                            placeholder="Chase Bank"
                                            value={formData.bankName}
                                            onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="accountNumber">Account Number</Label>
                                            <Input
                                                id="accountNumber"
                                                placeholder="123456789"
                                                value={formData.accountNumber}
                                                onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="swiftCode">SWIFT/BIC</Label>
                                            <Input
                                                id="swiftCode"
                                                placeholder="CHASUS33"
                                                value={formData.swiftCode}
                                                onChange={e => setFormData({ ...formData, swiftCode: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsAddingRecipient(false)}>Cancel</Button>
                                    <Button type="submit" disabled={!formData.name}>Save Recipient</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Dialog open={isEditingRecipient} onOpenChange={setIsEditingRecipient}>
                    <DialogContent className="sm:max-w-[500px]">
                        <form onSubmit={handleUpdateRecipient}>
                            <DialogHeader>
                                <DialogTitle>Edit Recipient</DialogTitle>
                                <DialogDescription>
                                    Update the details for this saved beneficiary.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-name">Full Name</Label>
                                    <Input
                                        id="edit-name"
                                        placeholder="e.g. John Doe"
                                        value={editFormData.name}
                                        onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-email">Email (Optional)</Label>
                                        <Input
                                            id="edit-email"
                                            type="email"
                                            placeholder="john@example.com"
                                            value={editFormData.email}
                                            onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-phone">Phone (Optional)</Label>
                                        <Input
                                            id="edit-phone"
                                            placeholder="+1 234 567 8900"
                                            value={editFormData.phone}
                                            onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <Separator className="my-2" />
                                <p className="text-sm font-medium text-muted-foreground">Bank Details (Optional)</p>

                                <div className="grid gap-2">
                                    <Label htmlFor="edit-bankName">Bank Name</Label>
                                    <Input
                                        id="edit-bankName"
                                        placeholder="Chase Bank"
                                        value={editFormData.bankName}
                                        onChange={e => setEditFormData({ ...editFormData, bankName: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-accountNumber">Account Number</Label>
                                        <Input
                                            id="edit-accountNumber"
                                            placeholder="123456789"
                                            value={editFormData.accountNumber}
                                            onChange={e => setEditFormData({ ...editFormData, accountNumber: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-swiftCode">SWIFT/BIC</Label>
                                        <Input
                                            id="edit-swiftCode"
                                            placeholder="CHASUS33"
                                            value={editFormData.swiftCode}
                                            onChange={e => setEditFormData({ ...editFormData, swiftCode: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsEditingRecipient(false)}>Cancel</Button>
                                <Button type="submit" disabled={!editFormData.name}>Save Changes</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Card>
                    <CardContent className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Search recipients by name or email..."
                                className="pl-10 h-12 text-lg"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <Skeleton key={i} className="h-48 w-full rounded-xl" />
                        ))}
                    </div>
                ) : filteredRecipients.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRecipients.map((recipient) => (
                            <Card key={recipient.id} className="group hover:shadow-md transition-all border-primary/5 hover:border-primary/20">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "h-12 w-12 rounded-full flex items-center justify-center text-xl font-bold",
                                                recipient.type === 'INTERNAL' ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
                                            )}>
                                                {recipient.name[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{recipient.name}</CardTitle>
                                                <Badge variant="secondary" className="mt-1">
                                                    {recipient.type === 'INTERNAL' ? 'Payvost User' : 'External Beneficiary'}
                                                </Badge>
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEditRecipient(recipient)}>
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/dashboard/payments/send`} className="flex items-center">
                                                        <Banknote className="mr-2 h-4 w-4" /> Send Money
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteRecipient(recipient.id)} disabled={isDeleting === recipient.id}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3 pt-2">
                                    <div className="space-y-2 text-sm">
                                        {recipient.email && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Mail className="h-4 w-4" />
                                                <span>{recipient.email}</span>
                                            </div>
                                        )}
                                        {recipient.phone && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Phone className="h-4 w-4" />
                                                <span>{recipient.phone}</span>
                                            </div>
                                        )}
                                        {recipient.bankName && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Landmark className="h-4 w-4" />
                                                <span>{recipient.bankName}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 flex gap-2">
                                        <Button asChild size="sm" className="flex-1 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary">
                                            <Link href={`/dashboard/payments/send`}>
                                                Send Money
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
                        <div className="bg-muted p-4 rounded-full mb-4">
                            <Users className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold">No recipients found</h3>
                        <p className="text-muted-foreground mt-2 max-w-xs">
                            {searchQuery ? "Try searching for a different name or email." : "Add your first recipient to start sending money faster."}
                        </p>
                        {searchQuery && (
                            <Button variant="ghost" className="mt-4" onClick={() => setSearchQuery('')}>
                                Clear Search
                            </Button>
                        )}
                        {!searchQuery && (
                            <Button className="mt-6" onClick={() => setIsAddingRecipient(true)}>
                                <Plus className="mr-2 h-4 w-4" /> Add Recipient
                            </Button>
                        )}
                    </div>
                )}
            </main>
        </>
    );
}
