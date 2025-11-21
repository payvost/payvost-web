'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Package } from 'lucide-react';

export default function InventoryPage() {
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
                    <p className="text-muted-foreground">Track and manage your product inventory.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Inventory Management</CardTitle>
                    <CardDescription>Monitor stock levels and manage product inventory.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Inventory Management Coming Soon</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Track stock levels, manage product variants, and set up low stock alerts.
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

