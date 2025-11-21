'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Repeat } from 'lucide-react';

export default function SubscriptionsPage() {
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Subscriptions</h2>
                    <p className="text-muted-foreground">Manage recurring subscriptions and billing cycles.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Subscription
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Subscription Management</CardTitle>
                    <CardDescription>View and manage all active and past subscriptions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <Repeat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Subscription Management Coming Soon</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Create and manage recurring subscription plans for your customers.
                        </p>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Subscription
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

