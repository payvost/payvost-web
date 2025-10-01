
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
    href: "/#",
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

export function SiteHeader({ showLogin = true, showRegister = true }: SiteHeaderProps) {
    return (
        <header className="sticky top-0 z-50 px-4 lg:px-6 h-14 flex items-center bg-background/95 backdrop-blur-sm border-b rounded-b-md">
            <Link href="/" className="flex items-center justify-center">
                <Icons.logo className="h-8" />
            </Link>
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
            <nav className="ml-auto flex items-center gap-4 sm:gap-6">
                 <div className="hidden md:flex">
                  <CountrySelector />
                </div>
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
        </header>
    )
}
