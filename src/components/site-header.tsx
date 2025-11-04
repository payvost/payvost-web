
'use client';

import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Globe, Wallet, BarChart, Landmark, ChevronDown } from "lucide-react";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { countries, Country } from "@/lib/countries";
import { ThemeSwitcher } from './theme-switcher';

const products: { title: string; href: string; description: string; icon: React.ReactNode }[] = [
  {
    title: "International Transfers",
    href: "/#",
    description: "Send money across borders with competitive exchange rates and low fees.",
    icon: <Globe className="h-5 w-5" />
  },
  {
    title: "Multi-Currency Wallets",
    href: "/dashboard",
    description: "Hold, manage, and spend in multiple currencies from a single account.",
    icon: <Wallet className="h-5 w-5" />
  },
  {
    title: "Live Exchange Rates",
    href: "/fx-rates",
    description: "Get real-time FX rates to make informed decisions for your transfers.",
    icon: <BarChart className="h-5 w-5" />
  },
  {
    title: "Local Bank Payouts",
    href: "/#countries",
    description: "Send funds directly to bank accounts in over 150 countries.",
    icon: <Landmark className="h-5 w-5" />
  },
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
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <div className="line-clamp-2 text-sm leading-snug text-muted-foreground">
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
            <nav className="ml-auto hidden lg:flex gap-4 sm:gap-6">
                <NavigationMenu>
                    <NavigationMenuList>
                        <NavigationMenuItem>
                            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                <Link href="/">Home</Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <NavigationMenuTrigger>Products</NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                                    {products.map((product) => (
                                        <ListItem
                                            key={product.title}
                                            title={product.title}
                                            href={product.href}
                                        >
                                            <div className="flex items-start gap-2">
                                                {product.icon}
                                                <span className="text-sm">{product.description}</span>
                                            </div>
                                        </ListItem>
                                    ))}
                                </ul>
                            </NavigationMenuContent>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                <Link href="/about">About Us</Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                <Link href="/blog">Blog</Link>
                            </NavigationMenuLink>
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
                    <Button asChild>
                        <Link href="/register">Get Started</Link>
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
                            <nav className="flex flex-col px-4 py-3 overflow-y-auto flex-1">
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
                                
                                <Link href="/about" className="py-3 text-base font-medium hover:text-primary transition-colors border-b">
                                    About Us
                                </Link>
                                <Link href="/blog" className="py-3 text-base font-medium hover:text-primary transition-colors border-b">
                                    Blog
                                </Link>
                            </nav>
                        </div>
                    </SheetContent>
                </Sheet>
            </nav>
        </header>
    )
}

