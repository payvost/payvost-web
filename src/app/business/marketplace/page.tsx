'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowRight, Search, Puzzle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const integrations = [
  { name: 'Shopify', slug: 'shopify', category: 'E-commerce', logo: 'https://placehold.co/40x40.png', hint: 'shopify logo', description: 'Sync payments from your Shopify store.', featured: true },
  { name: 'WooCommerce', slug: 'woocommerce', category: 'E-commerce', logo: 'https://placehold.co/40x40.png', hint: 'woocommerce logo', description: 'Integrate with your WordPress e-commerce site.', featured: true },
  { name: 'QuickBooks', slug: 'quickbooks', category: 'Accounting', logo: 'https://placehold.co/40x40.png', hint: 'quickbooks logo', description: 'Automate your bookkeeping and accounting.' },
  { name: 'Xero', slug: 'xero', category: 'Accounting', logo: 'https://placehold.co/40x40.png', hint: 'xero logo', description: 'Connect your Xero account for easy reconciliation.' },
  { name: 'Slack', slug: 'slack', category: 'Productivity', logo: 'https://placehold.co/40x40.png', hint: 'slack logo', description: 'Get notifications for payments and disputes in Slack.' },
  { name: 'Google Analytics', slug: 'google-analytics', category: 'Analytics', logo: 'https://placehold.co/40x40.png', hint: 'analytics logo', description: 'Track payment events and conversions.' },
];

export default function MarketplacePage() {
    return (
        <>
        <div className="flex items-center justify-between space-y-2 mb-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">App Marketplace</h2>
                <p className="text-muted-foreground">Connect Payvost with your favorite tools and services.</p>
            </div>
        </div>

        <Card>
            <CardHeader>
                 <div className="relative pt-4">
                    <Search className="absolute left-2.5 top-6.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search integrations..." className="pl-8 w-full md:w-1/3" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {integrations.map(app => (
                        <Card key={app.name} className="flex flex-col">
                            <CardHeader className="flex-row gap-4 items-center">
                                <img src={app.logo} data-ai-hint={app.hint} alt={app.name} className="h-10 w-10 rounded-md" />
                                <div className="flex-1">
                                    <CardTitle className="text-lg">{app.name}</CardTitle>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="mt-1">{app.category}</Badge>
                                      {app.featured && <Badge variant="secondary" className="mt-1">Featured</Badge>}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-sm text-muted-foreground">{app.description}</p>
                            </CardContent>
                            <CardFooter>
                                <Button asChild>
                                    <Link href={`/business/integrations/${app.slug}`}>Connect</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
        
        <Card className="mt-6">
          <CardHeader>
              <CardTitle>Build on Payvost</CardTitle>
              <CardDescription>Are you a developer? Build your own app and get featured on our marketplace.</CardDescription>
          </CardHeader>
          <CardFooter>
              <Button variant="outline">
                  Register Your App
                  <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
          </CardFooter>
        </Card>
    </>
    )
}
