'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Zap, Send, ArrowDownLeft, Wallet, ArrowRightLeft, CreditCard } from 'lucide-react';
import { CreateWalletDialog } from './create-wallet-dialog';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface QuickActionsDropdownProps {
  onWalletCreated?: () => void;
}

export function QuickActionsDropdown({ onWalletCreated }: QuickActionsDropdownProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isKycVerified, setIsKycVerified] = useState(false);
  const createWalletTriggerRef = useRef<HTMLButtonElement>(null);

  // Check KYC status
  React.useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const kycStatus = data.kycStatus;
        const normalizedKycStatus = typeof kycStatus === 'string' ? kycStatus.toLowerCase() : 'unverified';
        setIsKycVerified(normalizedKycStatus === 'verified');
      }
    });
    return () => unsub();
  }, [user]);

  const handleCreateWallet = () => {
    // Trigger the hidden button to open the dialog
    if (createWalletTriggerRef.current) {
      createWalletTriggerRef.current.click();
    }
  };

  const handleWalletCreated = () => {
    if (onWalletCreated) {
      onWalletCreated();
    }
    // Trigger a page refresh to update wallets
    router.refresh();
  };

  const quickActions = [
    {
      label: 'Send Payment',
      icon: <Send className="h-4 w-4" />,
      href: '/dashboard/payments/send',
      shortcut: '⌘K',
      description: 'Send money to users or banks',
    },
    {
      label: 'Request Payment',
      icon: <ArrowDownLeft className="h-4 w-4" />,
      href: '/dashboard/request-payment',
      shortcut: '⌘R',
      description: 'Request payment from others',
    },
    {
      label: 'View Transactions',
      icon: <ArrowRightLeft className="h-4 w-4" />,
      href: '/dashboard/transactions',
      shortcut: '⌘T',
      description: 'View transaction history',
    },
    {
      label: 'Add Virtual Card',
      icon: <CreditCard className="h-4 w-4" />,
      href: '/dashboard/cards',
      description: 'Create a new virtual card',
    },
  ];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <Zap className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Quick Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {quickActions.map((action) => (
              <DropdownMenuItem key={action.label} asChild>
                <Link
                  href={action.href}
                  className="flex items-center justify-between w-full cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {action.icon}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{action.label}</span>
                      {action.description && (
                        <span className="text-xs text-muted-foreground">{action.description}</span>
                      )}
                    </div>
                  </div>
                  {action.shortcut && (
                    <DropdownMenuShortcut>{action.shortcut}</DropdownMenuShortcut>
                  )}
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleCreateWallet}
              disabled={!isKycVerified}
              className="flex items-center justify-between w-full cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Create Wallet</span>
                  <span className="text-xs text-muted-foreground">
                    {!isKycVerified ? 'KYC verification required' : 'Add a new currency wallet'}
                  </span>
                </div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Wallet Dialog - Hidden trigger button */}
      <CreateWalletDialog
        onWalletCreated={handleWalletCreated}
        disabled={!isKycVerified}
      >
        <button 
          ref={createWalletTriggerRef} 
          type="button" 
          className="sr-only"
          aria-label="Create wallet dialog trigger"
        />
      </CreateWalletDialog>
    </>
  );
}

