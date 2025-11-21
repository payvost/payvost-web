'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign } from 'lucide-react';

export default function PricingPlansPage() {
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Pricing Plans</h2>
                    <p className="text-muted-foreground">Create and manage subscription pricing plans.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Plan
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pricing Plans</CardTitle>
                    <CardDescription>Design pricing plans for your products and services.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Pricing Plans Coming Soon</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Create tiered pricing plans, set up discounts, and manage plan features.
                        </p>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Plan
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

