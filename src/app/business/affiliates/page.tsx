'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';

export default function AffiliatesPage() {
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Affiliate Programs</h2>
                    <p className="text-muted-foreground">Manage your affiliate marketing programs and commissions.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Program
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Affiliate Programs</CardTitle>
                    <CardDescription>Set up and manage affiliate marketing programs.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Affiliate Programs Coming Soon</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Create affiliate programs, track referrals, and manage commission payouts.
                        </p>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Program
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

