
'use client';

import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FundingDetailsProps {
    wallet: {
        currency: string;
        name: string;
    } | null;
}

// These are mock details for demonstration purposes.
const accountDetails: { [key: string]: any } = {
    USD: {
        beneficiary: 'Payvost Inc.',
        accountNumber: '0123456789',
        routingNumber: '987654321',
        bankName: 'Global Citizen Bank',
        address: '123 Finance Street, New York, NY 10001, USA'
    },
    NGN: {
        beneficiary: 'Payvost Nigeria Ltd.',
        accountNumber: '9876543210',
        bankName: 'Providus Bank',
        address: '1 Payvost Close, Lagos, Nigeria'
    },
    // Add other currencies as needed
};

export function FundingDetails({ wallet }: FundingDetailsProps) {
    const { toast } = useToast();

    if (!wallet) {
        return (
             <SheetContent>
                <SheetHeader>
                    <SheetTitle>Funding Details</SheetTitle>
                    <SheetDescription>Please select a wallet to see funding instructions.</SheetDescription>
                </SheetHeader>
            </SheetContent>
        )
    }

    const details = accountDetails[wallet.currency] || accountDetails.USD;

    const detailsToCopy = Object.entries(details)
        .map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').toUpperCase()}: ${value}`)
        .join('\n');

    const handleCopy = () => {
        navigator.clipboard.writeText(detailsToCopy);
        toast({
            title: "Copied to Clipboard!",
            description: `Funding details for your ${wallet.currency} wallet have been copied.`,
        });
    }

    return (
        <SheetContent>
            <SheetHeader>
                <SheetTitle>Fund Your {wallet.currency} Wallet</SheetTitle>
                <SheetDescription>
                    Make a local bank transfer to the account details below.
                </SheetDescription>
            </SheetHeader>
            <div className="py-6 space-y-4">
                {Object.entries(details).map(([key, value]) => (
                     <div key={key} className="text-sm">
                        <p className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                        <p className="font-semibold">{value}</p>
                    </div>
                ))}
                <Separator />
                <p className="text-xs text-muted-foreground">
                    Please ensure you are sending {wallet.currency}. Funds sent in other currencies may be lost or subject to high conversion fees.
                </p>
            </div>
            <SheetFooter>
                <Button onClick={handleCopy} className="w-full">
                    <Copy className="mr-2 h-4 w-4"/>
                    Copy Details
                </Button>
            </SheetFooter>
        </SheetContent>
    )
}
