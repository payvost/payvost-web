'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Home, Wallet, CreditCard, FileText, Code, ShieldCheck, BarChart, DollarSign, HelpCircle, BookOpen, Users, Building2, Briefcase, Globe, TrendingUp, ChevronRight, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
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

const publicSearchItems: SearchItem[] = [
  // Navigation
  { title: 'Home', href: '/', icon: Home, category: 'Navigation', keywords: ['home', 'landing', 'main'] },
  
  // Products
  { title: 'Payments', href: '/payments', description: 'Accept and send money globally', icon: CreditCard, category: 'Products', keywords: ['payment', 'send', 'receive', 'money'] },
  { title: 'Payouts', href: '/payouts', description: 'Fast international settlements', icon: DollarSign, category: 'Products', keywords: ['payout', 'settlement', 'withdraw'] },
  { title: 'Accounts', href: '/accounts', description: 'Business and multi-currency accounts', icon: Wallet, category: 'Products', keywords: ['account', 'wallet', 'currency'] },
  { title: 'Cards', href: '/cards', description: 'Issue physical and virtual cards', icon: CreditCard, category: 'Products', keywords: ['card', 'virtual', 'physical', 'debit'] },
  { title: 'Invoicing', href: '/invoicing', description: 'Create, send and track invoices', icon: FileText, category: 'Products', keywords: ['invoice', 'billing', 'payment request'] },
  { title: 'Developer Tools', href: '/developers', description: 'APIs, SDKs, and sandbox environments', icon: Code, category: 'Products', keywords: ['api', 'developer', 'sdk', 'integration'] },
  { title: 'Escrow', href: '/escrow', description: 'Secure funds in transit', icon: ShieldCheck, category: 'Products', keywords: ['escrow', 'secure', 'hold'] },
  { title: 'Analytics & Automation', href: '/analytics', description: 'Insights, reporting and automation', icon: BarChart, category: 'Products', keywords: ['analytics', 'reporting', 'automation', 'insights'] },
  { title: 'FX Rates', href: '/fx-rates', description: 'Live foreign exchange rates', icon: TrendingUp, category: 'Products', keywords: ['fx', 'exchange', 'rates', 'currency', 'convert'] },
  
  // Solutions
  { title: 'For Businesses', href: '/solutions/business', description: 'Manage global payments, payroll and compliance', icon: Building2, category: 'Solutions', keywords: ['business', 'company', 'enterprise'] },
  { title: 'For Individuals', href: '/solutions/individuals', description: 'Personal accounts, saving and sending money', icon: Users, category: 'Solutions', keywords: ['individual', 'personal', 'consumer'] },
  { title: 'For Startups', href: '/solutions/startups', description: 'Scale quickly with embedded finance', icon: Sparkles, category: 'Solutions', keywords: ['startup', 'new', 'begin'] },
  { title: 'For Developers', href: '/solutions/developers', description: 'Tools, SDKs, and sample integrations', icon: Code, category: 'Solutions', keywords: ['developer', 'api', 'integration'] },
  { title: 'For Marketplaces', href: '/solutions/marketplaces', description: 'Handle multi-party flows and split payments', icon: Briefcase, category: 'Solutions', keywords: ['marketplace', 'platform', 'split'] },
  
  // Resources
  { title: 'Blog', href: '/blog', icon: BookOpen, category: 'Resources', keywords: ['blog', 'article', 'news'] },
  { title: 'Help Center', href: '/help', icon: HelpCircle, category: 'Resources', keywords: ['help', 'support', 'faq', 'guide'] },
  { title: 'Documentation', href: '/docs', icon: BookOpen, category: 'Resources', keywords: ['docs', 'documentation', 'guide', 'api'] },
  { title: 'Support', href: '/support', icon: HelpCircle, category: 'Resources', keywords: ['support', 'help', 'contact'] },
  
  // Company
  { title: 'About Us', href: '/about', icon: Users, category: 'Company', keywords: ['about', 'company', 'team'] },
  { title: 'Careers', href: '/careers', icon: Briefcase, category: 'Company', keywords: ['career', 'job', 'hiring'] },
  { title: 'Partners', href: '/partners', icon: Globe, category: 'Company', keywords: ['partner', 'integration'] },
  { title: 'Press & Media', href: '/press', icon: FileText, category: 'Company', keywords: ['press', 'media', 'news'] },
  { title: 'Compliance & Security', href: '/compliance', icon: ShieldCheck, category: 'Company', keywords: ['compliance', 'security', 'privacy'] },
];

function filterItems(query: string): SearchItem[] {
  if (!query.trim()) return [];
  
  const lowerQuery = query.toLowerCase();
  return publicSearchItems.filter(item => {
    const titleMatch = item.title.toLowerCase().includes(lowerQuery);
    const descMatch = item.description?.toLowerCase().includes(lowerQuery);
    const keywordMatch = item.keywords?.some(kw => kw.toLowerCase().includes(lowerQuery));
    return titleMatch || descMatch || keywordMatch;
  });
}

interface PublicSearchProps {
  onClose?: () => void;
}

export function PublicSearch({ onClose }: PublicSearchProps) {
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
    onClose?.();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full max-w-xs md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            placeholder="Search pages, features..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="pl-9 w-full bg-background"
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
                        className="flex items-center gap-3 cursor-pointer"
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

