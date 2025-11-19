
'use client';

import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Globe, Wallet, BarChart, Landmark, ChevronDown, CreditCard, FileText, Code, Users, ShieldCheck, DollarSign } from "lucide-react";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { countries, Country } from "@/lib/countries";
import { ThemeSwitcher } from './theme-switcher';

const products: { title: string; href: string; description: string; icon: React.ReactNode }[] = [
    {
        title: "Payments",
        href: "/payments",
        description: "Accept and send money globally with robust reconciliation and low fees.",
        icon: <CreditCard className="h-5 w-5" />
    },
    {
        title: "Payouts",
        href: "/payouts",
        description: "Fast international settlements to bank accounts and cards.",
        icon: <DollarSign className="h-5 w-5" />
    },
    {
        title: "Accounts",
        href: "/accounts",
        description: "Business and multi-currency accounts with local details in major markets.",
        icon: <Wallet className="h-5 w-5" />
    },
    {
        title: "Cards",
        href: "/cards",
        description: "Issue physical and virtual cards with spend controls and reporting.",
        icon: <CreditCard className="h-5 w-5" />
    },
    {
        title: "Invoicing",
        href: "/invoicing",
        description: "Create, send and track invoices — built for businesses at scale.",
        icon: <FileText className="h-5 w-5" />
    },
    {
        title: "Developer Tools",
        href: "/developers",
        description: "APIs, SDKs, and sandbox environments for deep integrations.",
        icon: <Code className="h-5 w-5" />
    },
    {
        title: "Escrow",
        href: "/escrow",
        description: "Secure funds in transit for marketplaces and high-value deals.",
        icon: <ShieldCheck className="h-5 w-5" />
    },
    {
        title: "Analytics & Automation",
        href: "/analytics",
        description: "Insights, reporting and automation to optimize cashflow.",
        icon: <BarChart className="h-5 w-5" />
    },
];

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
import { useState } from 'react';

export function SiteHeader({ showLogin = true, showRegister = true }: SiteHeaderProps) {
    const [productsOpen, setProductsOpen] = useState(false);
    
    return (
        <header className="sticky top-0 z-50 px-4 lg:px-6 h-14 flex items-center bg-background/95 backdrop-blur-sm border-b rounded-b-md">
            <Link href="/" className="flex items-center justify-center">
                <Icons.logo className="h-8" />
            </Link>
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex gap-6 mx-auto">
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
                                <ul className="grid w-[520px] gap-3 p-6 md:w-[700px] md:grid-cols-2 lg:w-[820px]">
                                    {products.map((product) => (
                                        <ListItem
                                            key={product.title}
                                            title={product.title}
                                            href={product.href}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="text-primary mt-0.5 transition-transform group-hover:scale-110">
                                                    {product.icon}
                                                </div>
                                                <span className="text-sm leading-relaxed">{product.description}</span>
                                            </div>
                                        </ListItem>
                                    ))}
                                </ul>
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
            <nav className="hidden lg:flex ml-auto items-center gap-4">
                <CountrySelector />
                <ThemeSwitcher />
                {showLogin && (
                    <Button variant="ghost" className="text-sm font-medium" asChild>
                        <Link href="/login">Login</Link>
                    </Button>
                )}
                {showRegister && (
                    <Button className="bg-primary text-white hover:opacity-95" asChild>
                        <Link href="/register">Create account</Link>
                    </Button>
                )}
            </nav>
            {/* Mobile Hamburger & Sheet */}
            <nav className="ml-auto flex items-center gap-2 lg:hidden">
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
    )
}

