
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, DollarSign, Users, Shield, FileText } from 'lucide-react';
import { BusinessProfileSettings } from '@/components/business-profile-settings';
import { BusinessFinancialSettings } from '@/components/business-financial-settings';
import { BusinessTeamSettings } from '@/components/business-team-settings';
import { BusinessSecuritySettings } from '@/components/business-security-settings';
import { BusinessInvoiceSettings } from '@/components/business-invoice-settings';

export default function BusinessSettingsPage() {
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Business Settings</h2>
                    <p className="text-muted-foreground">Manage your business profile, settings, and team members.</p>
                </div>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="mb-6 h-auto">
                    <TabsTrigger value="profile" className="py-2"><Briefcase className="mr-2 h-4 w-4"/>Profile</TabsTrigger>
                    <TabsTrigger value="financial"><DollarSign className="mr-2 h-4 w-4"/>Financials</TabsTrigger>
                    <TabsTrigger value="team"><Users className="mr-2 h-4 w-4"/>Team</TabsTrigger>
                    <TabsTrigger value="security"><Shield className="mr-2 h-4 w-4"/>Security</TabsTrigger>
                    <TabsTrigger value="invoicing"><FileText className="mr-2 h-4 w-4"/>Invoicing</TabsTrigger>
                </TabsList>
                <TabsContent value="profile">
                    <BusinessProfileSettings />
                </TabsContent>
                <TabsContent value="financial">
                    <BusinessFinancialSettings />
                </TabsContent>
                <TabsContent value="team">
                    <BusinessTeamSettings />
                </TabsContent>
                 <TabsContent value="security">
                    <BusinessSecuritySettings />
                </TabsContent>
                 <TabsContent value="invoicing">
                    <BusinessInvoiceSettings />
                </TabsContent>
            </Tabs>
        </>
    );
}
