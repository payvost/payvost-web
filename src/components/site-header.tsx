
'use client';

import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Globe, Wallet, BarChart, Landmark, ChevronDown, CreditCard, FileText, Code, Users, ShieldCheck, DollarSign, User, Building2, ArrowRight } from "lucide-react";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { countries, Country } from "@/lib/countries";
import { ThemeSwitcher } from './theme-switcher';

type ProductCategory = 'personal' | 'business';

type Product = { 
    title: string; 
    href: string; 
    description: string; 
    icon: React.ReactNode;
    isNew?: boolean;
};

const personalProducts: Product[] = [
    {
        title: "Payments",
        href: "/payments",
        description: "Supports local and cross-border payments with +150 countries.",
        icon: <CreditCard className="h-3.5 w-3.5" />
    },
    {
        title: "Bill Payments",
        href: "/bill-payments",
        description: "Pay bills across multiple countries from one place, no switching.",
        icon: <FileText className="h-3.5 w-3.5" />
    },
    {
        title: "Cards",
        href: "/cards",
        description: "Create and Get Virtual or physical Card, and one-time disposable Virtual debit cards",
        icon: <CreditCard className="h-3.5 w-3.5" />
    },
    {
        title: "Wallet",
        href: "/wallet",
        description: "Create up to 15+ wallets by currencies and manage your fx assets in one place.",
        icon: <Wallet className="h-3.5 w-3.5" />
    },
    {
        title: "Invoicing",
        href: "/invoicing",
        description: "Create, send and accept payment with our invoicing infrastructure.",
        icon: <FileText className="h-3.5 w-3.5" />
    },
    {
        title: "Split Payments",
        href: "/split-payments",
        description: "Split payments between friends and family at a go.",
        icon: <Users className="h-3.5 w-3.5" />
    },
    {
        title: "Donations",
        href: "/donations",
        description: "Raise funding for a cause with ease and share with the world.",
        icon: <DollarSign className="h-3.5 w-3.5" />
    },
    {
        title: "Recurring Payments",
        href: "/recurring-payments",
        description: "Set your Recurring payments and let payvost handle continous remittances.",
        icon: <CreditCard className="h-3.5 w-3.5" />
    },
    {
        title: "Events",
        href: "/events",
        description: "Collect payments easily for that event you want to organize and manage you tickets from one place.",
        icon: <FileText className="h-3.5 w-3.5" />
    },
    {
        title: "Escrow",
        href: "/escrow",
        description: "Explore our integrated escrow infrastructure to safeguard your payments.",
        icon: <ShieldCheck className="h-3.5 w-3.5" />,
        isNew: true
    },
];

const businessProducts: Product[] = [
    {
        title: "Advance Payments",
        href: "/payments",
        description: "High level multilateral infrastructure for payments of all kinds.",
        icon: <CreditCard className="h-3.5 w-3.5" />
    },
    {
        title: "Business Accounts",
        href: "/accounts",
        description: "Manage and segregate business accounts and sub-accounts for tracking expenses.",
        icon: <Wallet className="h-3.5 w-3.5" />
    },
    {
        title: "Business Invoicing",
        href: "/invoicing",
        description: "Create business automated and customized invoices with access to more template libraries on the go.",
        icon: <FileText className="h-3.5 w-3.5" />
    },
    {
        title: "Send Quotations",
        href: "/quotations",
        description: "With our quote builder, you can land leads and convert to invoice upon payments.",
        icon: <FileText className="h-3.5 w-3.5" />
    },
    {
        title: "Track Card spending",
        href: "/cards",
        description: "Create virtual cards for diffrent business purposes, monitor and set spending limits on the go.",
        icon: <CreditCard className="h-3.5 w-3.5" />
    },
    {
        title: "Team Management",
        href: "/team-management",
        description: "Assign roles to team members based on what matters to them, set permission levels at each role.",
        icon: <Users className="h-3.5 w-3.5" />
    },
    {
        title: "Accounting Automation",
        href: "/accounting",
        description: "Automate your bookkeeping process with our advanced ledger engine.",
        icon: <BarChart className="h-3.5 w-3.5" />
    },
    {
        title: "Inventory",
        href: "/inventory",
        description: "Mange your inventory, customers, orders,  and refunds on the go.",
        icon: <BarChart className="h-3.5 w-3.5" />
    },
    {
        title: "Developer Integration",
        href: "/developers",
        description: "Integrate Payvost with popular integrating partners like Shopify, WordPress,, Xerox, etc.",
        icon: <Code className="h-3.5 w-3.5" />
    },
];

// Keep original products array for mobile/backward compatibility
const products = [...personalProducts, ...businessProducts];

const solutions: { title: string; href: string; description?: string }[] = [
    { title: "For Businesses", href: "/solutions/business", description: "Manage global payments, payroll and compliance." },
    { title: "For Individuals", href: "/solutions/individuals", description: "Personal accounts, saving and sending money abroad." },
    { title: "For Startups", href: "/solutions/startups", description: "Scale quickly with embedded finance and flexible APIs." },
    { title: "For Developers", href: "/solutions/developers", description: "Tools, SDKs, and sample integrations to ship faster." },
    { title: "For Marketplaces", href: "/solutions/marketplaces", description: "Handle multi-party flows, split payments and fees." },
];

const company: { title: string; href: string }[] = [
    { title: "About Us", href: "/about" },
    { title: "Careers", href: "/careers" },
    { title: "Partners", href: "/partners" },
    { title: "Press & Media", href: "/press" },
    { title: "Compliance & Security", href: "/compliance" },
];

const resources: { title: string; href: string }[] = [
    { title: "Blog", href: "/blog" },
    { title: "Help Center", href: "/help" },
    { title: "Documentation", href: "/docs" },
    { title: "Learning Hub", href: "/academy" },
    { title: "Case Studies", href: "/case-studies" },
    { title: "Community", href: "/community" },
];

const developerLinks: { title: string; href: string }[] = [
    { title: "API Reference", href: "/docs/api" },
    { title: "SDKs & Libraries", href: "/docs/sdks" },
    { title: "Webhooks & Sandbox", href: "/docs/webhooks" },
    { title: "Status", href: "/status" },
    { title: "Integration Guides", href: "/docs/guides" },
];

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-lg p-4 leading-none no-underline outline-none transition-all hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground group",
            className
          )}
          {...props}
        >
          <div className="text-sm font-semibold leading-none group-hover:text-primary transition-colors">{title}</div>
          <div className="line-clamp-2 text-sm leading-snug text-muted-foreground mt-1.5">
            {children}
          </div>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"

interface SiteHeaderProps {
    showLogin?: boolean;
    showRegister?: boolean;
}

// Products Dropdown Component with Personal/Business hover submenus
const ProductsDropdownContent = () => {
    const [hoveredCategory, setHoveredCategory] = React.useState<ProductCategory | null>(null);
    
    const categories = [
        { id: 'personal' as ProductCategory, label: 'Personal', icon: <User className="h-4 w-4" />, products: personalProducts },
        { id: 'business' as ProductCategory, label: 'Business', icon: <Building2 className="h-4 w-4" />, products: businessProducts },
    ];

    return (
        <div className="w-full max-w-[700px] min-h-[300px]">
            <div className="flex relative min-h-[300px]">
                {/* Left Sidebar - Compact Category Navigation */}
                <div className="w-[180px] border-r border-border bg-muted/30 flex-shrink-0 min-h-[300px]">
                    <div className="p-3">
                        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Category
                        </div>
                        <nav className="space-y-0.5">
                            {categories.map((category) => (
                                <div
                                    key={category.id}
                                    className="relative"
                                    onMouseEnter={() => setHoveredCategory(category.id)}
                                    onMouseLeave={() => setHoveredCategory(null)}
                                >
                                    <button
                                        className={cn(
                                            "w-full flex items-center gap-2 rounded-md px-3 py-2 text-left transition-all duration-200 text-sm",
                                            hoveredCategory === category.id
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : "text-foreground hover:bg-accent hover:text-accent-foreground"
                                        )}
                                    >
                                        <div className={cn(
                                            "transition-colors",
                                            hoveredCategory === category.id ? "text-primary-foreground" : "text-muted-foreground"
                                        )}>
                                            {category.icon}
                                        </div>
                                        <span className="font-medium">{category.label}</span>
                                    </button>
                                    
                                    {/* Hover Submenu */}
                                    {hoveredCategory === category.id && (
                                        <div 
                                            className="absolute left-full top-0 ml-1 w-[500px] bg-popover border border-border rounded-lg shadow-lg p-4 z-[100] animate-in fade-in-0 slide-in-from-left-2 duration-200"
                                            onMouseEnter={() => setHoveredCategory(category.id)}
                                            onMouseLeave={() => setHoveredCategory(null)}
                                            style={{ 
                                                position: 'absolute',
                                                left: '100%',
                                                top: 0
                                            }}
                                        >
                                            <div className="space-y-1 max-h-[500px] overflow-y-auto">
                                                {category.products.map((product) => (
                                                    <NavigationMenuLink key={product.title} asChild>
                                                        <Link
                                                            href={product.href}
                                                            className="group flex flex-row items-start gap-3 rounded-lg p-2.5 transition-all duration-200 hover:bg-accent"
                                                        >
                                                            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-all duration-200 group-hover:bg-primary/20">
                                                                {product.icon}
                                                            </div>
                                                            <div className="flex-1 min-w-0 space-y-0.5">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="text-xs font-semibold leading-tight text-foreground transition-colors group-hover:text-primary truncate">
                                                                        {product.title}
                                                                    </div>
                                                                    {product.isNew && (
                                                                        <Badge variant="default" className="h-3.5 px-1.5 text-[9px] font-semibold flex-shrink-0">
                                                                            New
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <div className="text-[10px] leading-snug text-muted-foreground line-clamp-1">
                                                                    {product.description}
                                                                </div>
                                                            </div>
                                                            <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                                                        </Link>
                                                    </NavigationMenuLink>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CountrySelector = () => {
    const globalCountry: Country = { name: "Global", code: "global", flag: "globe" };
    const otherCountries = countries.filter(c => c.code !== "global");

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>Global</span>
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                 <DropdownMenuItem asChild>
                    <Link href="/" className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>Global</span>
                    </Link>
                </DropdownMenuItem>
                {otherCountries.map(country => (
                    <DropdownMenuItem key={country.code} asChild>
                        <Link href={`/${country.code.toLowerCase()}/home`} className="flex items-center gap-2">
                            <Image src={`/flag/${country.flag}`} alt={country.name} width={16} height={16} className="rounded-full" />
                            <span>{country.name}</span>
                        </Link>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

const MobileCountrySelector = () => {
    const otherCountries = countries.filter(c => c.code !== "global");

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Globe className="h-5 w-5" />
                    <span className="sr-only">Select country</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                 <DropdownMenuItem asChild>
                    <Link href="/" className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>Global</span>
                    </Link>
                </DropdownMenuItem>
                {otherCountries.map(country => (
                    <DropdownMenuItem key={country.code} asChild>
                        <Link href={`/${country.code.toLowerCase()}/home`} className="flex items-center gap-2">
                            <Image src={`/flag/${country.flag}`} alt={country.name} width={16} height={16} className="rounded-full" />
                            <span>{country.name}</span>
                        </Link>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { Menu, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PublicSearch } from '@/components/public-search';

export function SiteHeader({ showLogin = true, showRegister = true }: SiteHeaderProps) {
    const [productsOpen, setProductsOpen] = useState(false);
    const [commandOpen, setCommandOpen] = useState(false);
    const router = useRouter();

    // Keyboard shortcut for command palette (Cmd+K / Ctrl+K)
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setCommandOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const navigationItems = [
        { title: "Home", href: "/", group: "Navigation", icon: "🏠" },
        { title: "Dashboard", href: "/dashboard", group: "Navigation", icon: "📊" },
        { title: "Wallets", href: "/dashboard/wallets", group: "Navigation", icon: "💼" },
        { title: "Transactions", href: "/dashboard/transactions", group: "Navigation", icon: "💳" },
        { title: "Request Payment", href: "/dashboard/request-payment", group: "Navigation", icon: "💰" },
        { title: "Disputes", href: "/dashboard/dispute", group: "Navigation", icon: "⚖️" },
        { title: "Profile", href: "/dashboard/profile", group: "Navigation", icon: "👤" },
        { title: "Payments", href: "/payments", group: "Products", icon: "💸" },
        { title: "Payouts", href: "/payouts", group: "Products", icon: "📤" },
        { title: "Accounts", href: "/accounts", group: "Products", icon: "🏦" },
        { title: "Cards", href: "/cards", group: "Products", icon: "💳" },
        { title: "Invoicing", href: "/invoicing", group: "Products", icon: "📄" },
        { title: "Developer Tools", href: "/developers", group: "Products", icon: "⚙️" },
        { title: "Escrow", href: "/escrow", group: "Products", icon: "🔒" },
        { title: "Analytics & Automation", href: "/analytics", group: "Products", icon: "📈" },
        { title: "FX Rates", href: "/fx-rates", group: "Products", icon: "💱" },
        { title: "Blog", href: "/blog", group: "Resources", icon: "📝" },
        { title: "Help Center", href: "/help", group: "Resources", icon: "❓" },
        { title: "Documentation", href: "/docs", group: "Resources", icon: "📚" },
        { title: "About Us", href: "/about", group: "Company", icon: "ℹ️" },
        { title: "Careers", href: "/careers", group: "Company", icon: "💼" },
    ];

    const actionItems = [
        { title: "Create Wallet", href: "/dashboard/wallets", action: "create-wallet", group: "Actions" },
        { title: "Send Money", href: "/dashboard/payments", action: "send", group: "Actions" },
        { title: "Request Payment", href: "/dashboard/request-payment", action: "request", group: "Actions" },
        { title: "Create Invoice", href: "/dashboard/request-payment?tab=invoice&create=true", action: "invoice", group: "Actions" },
        { title: "View Transactions", href: "/dashboard/transactions", action: "transactions", group: "Actions" },
    ];

    const groupedItems = navigationItems.reduce((acc, item) => {
        if (!acc[item.group]) {
            acc[item.group] = [];
        }
        acc[item.group].push(item);
        return acc;
    }, {} as Record<string, typeof navigationItems>);

    const actionGroups = actionItems.reduce((acc, item) => {
        if (!acc[item.group]) {
            acc[item.group] = [];
        }
        acc[item.group].push(item);
        return acc;
    }, {} as Record<string, typeof actionItems>);
    
    return (
        <>
            <header className="sticky top-0 z-50 px-4 lg:px-6 h-14 flex items-center justify-between bg-background/95 border-b rounded-b-md">
            <Link href="/" className="flex items-center justify-start">
                <Icons.logo className="h-8" />
            </Link>
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex gap-6 justify-center flex-1">
                <NavigationMenu>
                    <NavigationMenuList>
                        <NavigationMenuItem>
                            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                <Link href="/">Home</Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>

                        <NavigationMenuItem>
                            <NavigationMenuTrigger className="data-[state=open]:bg-accent/50">
                                Products
                            </NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <ProductsDropdownContent />
                            </NavigationMenuContent>
                        </NavigationMenuItem>

                        <NavigationMenuItem>
                            <NavigationMenuTrigger className="data-[state=open]:bg-accent/50">
                                Solutions
                            </NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <ul className="w-[320px] p-6 space-y-1">
                                    {solutions.map(s => (
                                        <li key={s.title}>
                                            <NavigationMenuLink asChild>
                                                <Link 
                                                    href={s.href} 
                                                    className="block rounded-md p-3 hover:bg-accent transition-colors group"
                                                >
                                                    <div className="text-sm font-medium group-hover:text-primary transition-colors">
                                                        {s.title}
                                                    </div>
                                                    {s.description && (
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            {s.description}
                                                        </div>
                                                    )}
                                                </Link>
                                            </NavigationMenuLink>
                                        </li>
                                    ))}
                                </ul>
                            </NavigationMenuContent>
                        </NavigationMenuItem>

                        <NavigationMenuItem>
                            <NavigationMenuTrigger className="data-[state=open]:bg-accent/50">
                                Resources
                            </NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <ul className="w-[280px] p-6 space-y-1">
                                    {resources.map(r => (
                                        <li key={r.title}>
                                            <NavigationMenuLink asChild>
                                                <Link 
                                                    href={r.href} 
                                                    className="block rounded-md p-3 hover:bg-accent transition-colors group"
                                                >
                                                    <div className="text-sm font-medium group-hover:text-primary transition-colors">
                                                        {r.title}
                                                    </div>
                                                </Link>
                                            </NavigationMenuLink>
                                        </li>
                                    ))}
                                </ul>
                            </NavigationMenuContent>
                        </NavigationMenuItem>

                        <NavigationMenuItem>
                            <NavigationMenuTrigger className="data-[state=open]:bg-accent/50">
                                Company
                            </NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <ul className="w-[280px] p-6 space-y-1">
                                    {company.map(c => (
                                        <li key={c.title}>
                                            <NavigationMenuLink asChild>
                                                <Link 
                                                    href={c.href} 
                                                    className="block rounded-md p-3 hover:bg-accent transition-colors group"
                                                >
                                                    <div className="text-sm font-medium group-hover:text-primary transition-colors">
                                                        {c.title}
                                                    </div>
                                                </Link>
                                            </NavigationMenuLink>
                                        </li>
                                    ))}
                                </ul>
                            </NavigationMenuContent>
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>
            </nav>
            {/* Desktop Right Actions */}
            <nav className="hidden lg:flex items-center gap-4 justify-end">
                <PublicSearch />
                <CountrySelector />
                <div className="w-8" />
                <ThemeSwitcher />
                {showLogin && (
                    <Button variant="ghost" className="text-sm font-medium" asChild>
                        <Link href="/login">Login</Link>
                    </Button>
                )}
                {showRegister && (
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                        <Link href="/register">Create account</Link>
                    </Button>
                )}
            </nav>
            {/* Mobile Hamburger & Sheet */}
            <nav className="flex items-center gap-2 lg:hidden">
                <ThemeSwitcher />
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="p-2">
                            <Menu className="h-6 w-6" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="p-0 w-80">
                        <div className="flex flex-col h-full">
                            {/* Header with Logo and Country Selector */}
                            <div className="flex items-center justify-between pl-4 pr-12 py-3 border-b">
                                <Link href="/" className="flex items-center">
                                    <Icons.logo className="h-7" />
                                </Link>
                                <MobileCountrySelector />
                            </div>
                            
                            {/* Login and Get Started Buttons - Side by Side */}
                            <div className="px-4 pt-4 pb-3 border-b">
                                <div className="flex gap-2">
                                    {showLogin && (
                                        <Button variant="outline" className="flex-1" asChild>
                                            <Link href="/login">Login</Link>
                                        </Button>
                                    )}
                                    {showRegister && (
                                        <Button className="flex-1" asChild>
                                            <Link href="/register">Get Started</Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                            
                            {/* Mobile Search */}
                            <div className="px-4 pt-4 pb-3 border-b">
                                <PublicSearch />
                            </div>
                            
                            {/* Navigation Links */}
                            <nav className="flex flex-col px-4 py-3 overflow-y-auto flex-1 space-y-1">
                                <Link href="/" className="py-3 text-base font-medium hover:text-primary transition-colors border-b">
                                    Home
                                </Link>

                                {/* Products Collapsible */}
                                <Collapsible open={productsOpen} onOpenChange={setProductsOpen}>
                                    <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-base font-medium hover:text-primary transition-colors border-b">
                                        <span>Products</span>
                                        <ChevronRight className={cn("h-4 w-4 transition-transform", productsOpen && "rotate-90")} />
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="border-b">
                                        <div className="py-2 space-y-1">
                                            {products.map((product) => (
                                                <Link 
                                                    key={product.title}
                                                    href={product.href}
                                                    className="flex items-start gap-3 p-3 rounded-md hover:bg-accent transition-colors"
                                                >
                                                    <div className="mt-0.5">{product.icon}</div>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium">{product.title}</div>
                                                        <div className="text-xs text-muted-foreground mt-1">{product.description}</div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>

                                {/* Solutions */}
                                <Collapsible>
                                    <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-base font-medium hover:text-primary transition-colors border-b">
                                        <span>Solutions</span>
                                        <ChevronRight className="h-4 w-4" />
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="border-b">
                                        <div className="py-2 space-y-1">
                                            {solutions.map(s => (
                                                <Link key={s.title} href={s.href} className="block p-3 rounded-md hover:bg-accent">
                                                    <div className="text-sm font-medium">{s.title}</div>
                                                    <div className="text-xs text-muted-foreground">{s.description}</div>
                                                </Link>
                                            ))}
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>

                                {/* Resources */}
                                <Collapsible>
                                    <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-base font-medium hover:text-primary transition-colors border-b">
                                        <span>Resources</span>
                                        <ChevronRight className="h-4 w-4" />
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="border-b">
                                        <div className="py-2 space-y-1">
                                            {resources.map(r => (
                                                <Link key={r.title} href={r.href} className="block p-3 rounded-md hover:bg-accent">
                                                    <div className="text-sm font-medium">{r.title}</div>
                                                </Link>
                                            ))}
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>

                                {/* Company */}
                                <Collapsible>
                                    <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-base font-medium hover:text-primary transition-colors border-b">
                                        <span>Company</span>
                                        <ChevronRight className="h-4 w-4" />
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="border-b">
                                        <div className="py-2 space-y-1">
                                            {company.map(c => (
                                                <Link key={c.title} href={c.href} className="block p-3 rounded-md hover:bg-accent">
                                                    <div className="text-sm font-medium">{c.title}</div>
                                                </Link>
                                            ))}
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            </nav>
                        </div>
                    </SheetContent>
                </Sheet>
            </nav>
        </header>
        <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                {Object.entries(actionGroups).map(([group, items]) => (
                    <CommandGroup key={group} heading={group}>
                        {items.map((item) => (
                            <CommandItem
                                key={item.href}
                                onSelect={() => {
                                    router.push(item.href);
                                    setCommandOpen(false);
                                }}
                            >
                                <span className="mr-2">⚡</span>
                                {item.title}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                ))}
                <CommandSeparator />
                {Object.entries(groupedItems).map(([group, items]) => (
                    <CommandGroup key={group} heading={group}>
                        {items.map((item) => (
                            <CommandItem
                                key={item.href}
                                onSelect={() => {
                                    router.push(item.href);
                                    setCommandOpen(false);
                                }}
                            >
                                {item.icon && <span className="mr-2">{item.icon}</span>}
                                {item.title}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                ))}
                <CommandSeparator />
                <CommandGroup heading="Account">
                    <CommandItem
                        onSelect={() => {
                            router.push('/register');
                            setCommandOpen(false);
                        }}
                    >
                        <span className="mr-2">✨</span>
                        Create Account
                    </CommandItem>
                    {showLogin && (
                        <CommandItem
                            onSelect={() => {
                                router.push('/login');
                                setCommandOpen(false);
                            }}
                        >
                            <span className="mr-2">🔐</span>
                            Login
                        </CommandItem>
                    )}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
        </>
    )
}

