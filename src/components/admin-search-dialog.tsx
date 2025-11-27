'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Search, Users, DollarSign, FileText, Settings, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';

interface SearchResult {
  type: 'user' | 'transaction' | 'page' | 'setting';
  title: string;
  description?: string;
  href: string;
  icon: React.ReactNode;
}

const searchablePages: SearchResult[] = [
  { type: 'page', title: 'Dashboard', href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard', icon: <Search className="h-4 w-4" /> },
  { type: 'page', title: 'All Transactions', href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/transactions', icon: <DollarSign className="h-4 w-4" /> },
  { type: 'page', title: 'Customer Management', href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/customers', icon: <Users className="h-4 w-4" /> },
  { type: 'page', title: 'KYC Review', href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/kyc-review', icon: <ShieldCheck className="h-4 w-4" /> },
  { type: 'page', title: 'Real-Time Monitoring', href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/real-time', icon: <Search className="h-4 w-4" /> },
  { type: 'page', title: 'Settings', href: '/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/settings', icon: <Settings className="h-4 w-4" /> },
];

interface AdminSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminSearchDialog({ open, onOpenChange }: AdminSearchDialogProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);

  const filteredResults = searchablePages.filter((item) => {
    if (!debouncedQuery) return false;
    const query = debouncedQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query)
    );
  });

  const handleSelect = (href: string) => {
    router.push(href);
    onOpenChange(false);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Search Admin Dashboard</DialogTitle>
          <DialogDescription>
            Search for pages, users, transactions, and settings
          </DialogDescription>
        </DialogHeader>
        <Command className="rounded-lg border-none">
          <CommandInput
            placeholder="Search..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {debouncedQuery && filteredResults.length === 0 ? (
              <CommandEmpty>No results found.</CommandEmpty>
            ) : (
              <>
                {debouncedQuery && (
                  <CommandGroup heading="Pages">
                    {filteredResults.map((item) => (
                      <CommandItem
                        key={item.href}
                        value={item.title}
                        onSelect={() => handleSelect(item.href)}
                        className="flex items-center gap-2"
                      >
                        {item.icon}
                        <div className="flex flex-col">
                          <span>{item.title}</span>
                          {item.description && (
                            <span className="text-xs text-muted-foreground">{item.description}</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {!debouncedQuery && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Start typing to search...
                  </div>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

