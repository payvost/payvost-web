'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Link as LinkIcon, Copy, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function BusinessPaymentLinksPage() {
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Payment Links</h2>
                    <p className="text-muted-foreground">Create and manage payment links for easy customer payments.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Payment Link
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Payment Links</CardTitle>
                    <CardDescription>Manage your payment links and track their performance.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <LinkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No payment links yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Create your first payment link to start accepting payments from customers.
                        </p>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Payment Link
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

