'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Home, Wallet, CreditCard, FileText, Settings, HelpCircle, 
  ArrowRightLeft, Send, HandCoins, Ticket, ShieldCheck, ShieldAlert, 
  Puzzle, Store, Briefcase, Bell, LifeBuoy, LineChart, Users, 
  Calendar, BarChart3, TrendingUp, Lock, Key, UserCog,
  Receipt, QrCode, Link as LinkIcon, Repeat, Gift, Zap, Smartphone,
  Globe, BookOpen, MessageSquare, ChevronRight, Upload
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface SearchItem {
  title: string;
  href: string;
  description?: string;
  icon: React.ElementType;
  category: string;
  keywords?: string[];
}

const dashboardSearchItems: SearchItem[] = [
  // Dashboard & Overview
  { title: 'Dashboard', href: '/dashboard', description: 'Overview of your account', icon: Home, category: 'Dashboard', keywords: ['home', 'overview', 'main'] },
  { title: 'Get Started', href: '/dashboard/get-started', description: 'Complete your account setup', icon: Briefcase, category: 'Dashboard', keywords: ['setup', 'onboarding', 'tutorial'] },
  
  // Wallets & Accounts
  { title: 'Wallets', href: '/dashboard/wallets', description: 'Manage your wallets and balances', icon: Wallet, category: 'Wallets & Accounts', keywords: ['wallet', 'balance', 'account', 'money'] },
  { title: 'Virtual Cards', href: '/dashboard/wallets', description: 'Create and manage virtual cards', icon: CreditCard, category: 'Wallets & Accounts', keywords: ['card', 'virtual', 'debit'] },
  
  // Transactions
  { title: 'Transactions', href: '/dashboard/transactions', description: 'View all your transactions', icon: Receipt, category: 'Transactions', keywords: ['transaction', 'history', 'payment', 'transfer'] },
  { title: 'Track Transfer', href: '/track-transfer', description: 'Track a specific transfer', icon: Search, category: 'Transactions', keywords: ['track', 'find', 'transfer'] },
  
  // Payments
  { title: 'Payments', href: '/dashboard/payments/send', description: 'Send money and make payments', icon: Send, category: 'Payments', keywords: ['payment', 'send', 'remittance', 'transfer'] },
  { title: 'Send Money', href: '/dashboard/payments/send', description: 'International transfers and remittances', icon: ArrowRightLeft, category: 'Payments', keywords: ['send', 'transfer', 'remittance'] },
  { title: 'Request Payment', href: '/dashboard/request-payment', description: 'Request payments from others', icon: HandCoins, category: 'Payments', keywords: ['request', 'invoice', 'collect'] },
  { title: 'Payment Links', href: '/dashboard/request-payment?tab=payment-link', description: 'Create shareable payment links', icon: LinkIcon, category: 'Payments', keywords: ['link', 'share', 'url'] },
  { title: 'Invoices', href: '/dashboard/request-payment?tab=invoice', description: 'Create and manage invoices', icon: FileText, category: 'Payments', keywords: ['invoice', 'billing', 'bill'] },
  { title: 'Recurring Payments', href: '/dashboard/request-payment?tab=recurring', description: 'Set up recurring payment requests', icon: Repeat, category: 'Payments', keywords: ['recurring', 'subscription', 'repeat'] },
  { title: 'Split Payments', href: '/dashboard/request-payment?tab=split-payment', description: 'Split payments between multiple people', icon: Users, category: 'Payments', keywords: ['split', 'share', 'divide'] },
  { title: 'Event Tickets', href: '/dashboard/request-payment?tab=event-tickets', description: 'Sell tickets for events', icon: Ticket, category: 'Payments', keywords: ['ticket', 'event', 'sell'] },
  { title: 'Donations', href: '/dashboard/request-payment?tab=donations', description: 'Create donation campaigns', icon: Gift, category: 'Payments', keywords: ['donation', 'campaign', 'charity'] },
  { title: 'Bill Payment', href: '/dashboard/payments/bills', description: 'Pay utility bills and services', icon: Zap, category: 'Payments', keywords: ['bill', 'utility', 'electricity', 'airtime'] },
  { title: 'Bulk Payments', href: '/dashboard/payments/bulk', description: 'Upload and pay multiple recipients', icon: Upload, category: 'Payments', keywords: ['bulk', 'multiple', 'batch'] },
  { title: 'Scheduled Payments', href: '/dashboard/payments/scheduled', description: 'View and manage scheduled payments', icon: Calendar, category: 'Payments', keywords: ['scheduled', 'future', 'planned'] },
  { title: 'Gift Cards', href: '/dashboard/payments/gift-cards', description: 'Browse gift card catalog', icon: Gift, category: 'Payments', keywords: ['gift', 'card', 'voucher'] },
  
  // Disputes & Security
  { title: 'Disputes', href: '/dashboard/dispute', description: 'Manage transaction disputes', icon: ShieldAlert, category: 'Disputes & Security', keywords: ['dispute', 'chargeback', 'refund'] },
  { title: 'Escrow', href: '/dashboard/escrow', description: 'Secure escrow transactions', icon: ShieldCheck, category: 'Disputes & Security', keywords: ['escrow', 'secure', 'hold'] },
  
  // Profile & Settings
  { title: 'Profile', href: '/dashboard/profile', description: 'Manage your profile information', icon: UserCog, category: 'Profile & Settings', keywords: ['profile', 'account', 'personal'] },
  { title: 'Settings', href: '/dashboard/settings', description: 'Account settings and preferences', icon: Settings, category: 'Profile & Settings', keywords: ['settings', 'preferences', 'config'] },
  { title: 'Security', href: '/dashboard/settings/security', description: 'Security and authentication settings', icon: Lock, category: 'Profile & Settings', keywords: ['security', 'password', '2fa', 'pin'] },
  { title: 'Notifications', href: '/dashboard/notifications', description: 'Manage notification preferences', icon: Bell, category: 'Profile & Settings', keywords: ['notification', 'alert', 'email'] },
  
  // Support & Help
  { title: 'Support', href: '/dashboard/support', description: 'Get help and support', icon: LifeBuoy, category: 'Support & Help', keywords: ['support', 'help', 'assistance'] },
  { title: 'Help Center', href: '/help', description: 'Browse help articles and guides', icon: HelpCircle, category: 'Support & Help', keywords: ['help', 'guide', 'faq', 'documentation'] },
  { title: 'Contact Support', href: '/dashboard/support', description: 'Contact our support team', icon: MessageSquare, category: 'Support & Help', keywords: ['contact', 'message', 'chat'] },
  
  // Operations
  { title: 'Customers', href: '/dashboard/customers', description: 'Manage your customers', icon: Users, category: 'Operations', keywords: ['customer', 'client', 'contact'] },
  { title: 'Integrations', href: '/dashboard/integrations', description: 'Connect third-party services', icon: Puzzle, category: 'Operations', keywords: ['integration', 'api', 'connect'] },
  { title: 'Analytics', href: '/dashboard', description: 'View analytics and reports', icon: BarChart3, category: 'Operations', keywords: ['analytics', 'report', 'statistics'] },
  
  // Investment
  { title: 'Investment', href: '/dashboard/investment', description: 'Browse investment opportunities', icon: TrendingUp, category: 'Investment', keywords: ['investment', 'invest', 'portfolio'] },
  
  // Tools
  { title: 'FX Rates', href: '/fx-rates', description: 'View live exchange rates', icon: Globe, category: 'Tools', keywords: ['fx', 'exchange', 'rate', 'currency'] },
];

function filterItems(query: string): SearchItem[] {
  if (!query.trim()) return [];
  
  const lowerQuery = query.toLowerCase();
  return dashboardSearchItems.filter(item => {
    const titleMatch = item.title.toLowerCase().includes(lowerQuery);
    const descMatch = item.description?.toLowerCase().includes(lowerQuery);
    const keywordMatch = item.keywords?.some(kw => kw.toLowerCase().includes(lowerQuery));
    return titleMatch || descMatch || keywordMatch;
  });
}

export function DashboardSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredItems = filterItems(query);
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SearchItem[]>);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleSelect = (href: string) => {
    router.push(href);
    setOpen(false);
    setQuery('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            placeholder="Search features, settings..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="pl-9 w-full bg-muted/50"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0 max-h-[400px] overflow-hidden" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false} className="rounded-lg">
          <CommandList className="max-h-[400px]">
            {filteredItems.length === 0 ? (
              <CommandEmpty>No results found.</CommandEmpty>
            ) : (
              Object.entries(groupedItems).map(([category, items]) => (
                <CommandGroup key={category} heading={category}>
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <CommandItem
                        key={item.href}
                        value={item.title}
                        onSelect={() => handleSelect(item.href)}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{item.title}</div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {item.description}
                            </div>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

