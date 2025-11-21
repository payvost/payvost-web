'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Settings } from 'lucide-react';
import Link from 'next/link';

const integrations = [
    { name: 'Shopify', category: 'E-commerce', status: 'connected', description: 'Sync orders and payments from your Shopify store.' },
    { name: 'WooCommerce', category: 'E-commerce', status: 'available', description: 'Integrate with your WordPress e-commerce site.' },
    { name: 'QuickBooks', category: 'Accounting', status: 'connected', description: 'Automate your bookkeeping and accounting.' },
    { name: 'Xero', category: 'Accounting', status: 'available', description: 'Connect your Xero account for easy reconciliation.' },
    { name: 'Slack', category: 'Productivity', status: 'available', description: 'Get notifications for payments and disputes in Slack.' },
    { name: 'Zapier', category: 'Automation', status: 'available', description: 'Connect Payvost with 5000+ apps via Zapier.' },
];

export default function BusinessIntegrationsPage() {
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Integrations</h2>
                    <p className="text-muted-foreground">Connect Payvost with your favorite tools and services.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {integrations.map((integration) => (
                    <Card key={integration.name} className="flex flex-col">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{integration.name}</CardTitle>
                                {integration.status === 'connected' ? (
                                    <Badge variant="default" className="flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        Connected
                                    </Badge>
                                ) : (
                                    <Badge variant="outline">Available</Badge>
                                )}
                            </div>
                            <Badge variant="secondary" className="mt-2 w-fit">
                                {integration.category}
                            </Badge>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground">{integration.description}</p>
                        </CardContent>
                        <CardFooter>
                            {integration.status === 'connected' ? (
                                <Button variant="outline" className="w-full">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Manage
                                </Button>
                            ) : (
                                <Button className="w-full">
                                    Connect
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Need a custom integration?</CardTitle>
                    <CardDescription>
                        We can help you build a custom integration for your specific needs.
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button variant="outline" asChild>
                        <Link href="/business/support">Contact Support</Link>
                    </Button>
                </CardFooter>
            </Card>
        </>
    );
}

