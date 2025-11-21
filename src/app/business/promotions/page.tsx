'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Tag } from 'lucide-react';

export default function PromotionsPage() {
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Promotions & Discounts</h2>
                    <p className="text-muted-foreground">Create and manage promotional campaigns and discount codes.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Promotion
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Promotions & Discounts</CardTitle>
                    <CardDescription>Manage promotional campaigns and discount codes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Promotions Coming Soon</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Create discount codes, set up promotional campaigns, and track their performance.
                        </p>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Promotion
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

