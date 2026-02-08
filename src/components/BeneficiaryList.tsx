import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Users, Landmark, Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { Recipient } from '@/services';

interface BeneficiaryListProps {
    type: 'INTERNAL' | 'EXTERNAL';
    beneficiaries: Recipient[];
    onSelect: (beneficiary: Recipient) => void;
    isLoading?: boolean;
}

export function BeneficiaryList({ type, beneficiaries, onSelect, isLoading }: BeneficiaryListProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredBeneficiaries = beneficiaries.filter(b =>
        b.type === type &&
        (b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.accountNumber?.includes(searchQuery) ||
            b.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <Card className="h-full border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            {type === 'INTERNAL' ? <Users className="h-5 w-5" /> : <Landmark className="h-5 w-5" />}
                            {type === 'INTERNAL' ? 'Payment ID Beneficiaries' : 'Bank Beneficiaries'}
                        </CardTitle>
                        <CardDescription>
                            Select a saved beneficiary to quickly populate the form.
                        </CardDescription>
                    </div>
                </div>
                <div className="relative mt-4">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search beneficiaries..."
                        className="pl-8 bg-background"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
                <div className="space-y-3">
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-2">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-3 w-1/3" />
                                </div>
                            </div>
                        ))
                    ) : filteredBeneficiaries.length > 0 ? (
                        filteredBeneficiaries.map((beneficiary) => (
                            <Button
                                key={beneficiary.id}
                                variant="ghost"
                                className="w-full justify-start h-auto p-3 hover:bg-accent/50 group"
                                onClick={() => onSelect(beneficiary)}
                            >
                                <div className="flex items-center gap-3 w-full">
                                    <Avatar className="h-10 w-10 border group-hover:border-primary/50 transition-colors">
                                        <AvatarImage src={(beneficiary as any).avatar} />
                                        <AvatarFallback className="bg-primary/5 text-primary">
                                            {beneficiary.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col items-start overflow-hidden">
                                        <span className="font-medium text-sm truncate w-full text-left">
                                            {beneficiary.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground truncate w-full text-left">
                                            {type === 'INTERNAL'
                                                ? (beneficiary as any).email || (beneficiary as any).payvostUserId || 'Payment ID'
                                                : `${beneficiary.bankName} • ****${beneficiary.accountNumber?.slice(-4)}`
                                            }
                                        </span>
                                    </div>
                                </div>
                            </Button>
                        ))
                    ) : (
                        <div className="text-center py-10 bg-muted/20 rounded-lg border border-dashed">
                            <span className="text-sm text-muted-foreground block mb-1">No beneficiaries found</span>
                            <p className="text-xs text-muted-foreground px-4">
                                Beneficiaries are automatically added after your first successful transaction.
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
