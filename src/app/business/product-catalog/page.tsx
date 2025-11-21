'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Grid } from 'lucide-react';

export default function ProductCatalogPage() {
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Product Catalog</h2>
                    <p className="text-muted-foreground">Manage your product catalog and pricing.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Product Catalog</CardTitle>
                    <CardDescription>Create and manage your product catalog.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <Grid className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Product Catalog Coming Soon</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Build and manage your product catalog with images, descriptions, and pricing.
                        </p>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Product
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

