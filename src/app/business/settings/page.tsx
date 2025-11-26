
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, DollarSign, Users, Shield, FileText, Settings2 } from 'lucide-react';
import { BusinessProfileSettings } from '@/components/business-profile-settings';
import { BusinessFinancialSettings } from '@/components/business-financial-settings';
import { BusinessTeamSettings } from '@/components/business-team-settings';
import { BusinessSecuritySettings } from '@/components/business-security-settings';
import { BusinessInvoiceSettings } from '@/components/business-invoice-settings';
import { Badge } from '@/components/ui/badge';

export default function BusinessSettingsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Settings2 className="h-8 w-8 text-primary" />
                        Business Settings
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        Manage your business profile, financial settings, team members, security, and invoicing preferences.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="mb-6 h-auto w-full justify-start overflow-x-auto">
                    <TabsTrigger value="profile" className="flex items-center gap-1.5 py-1.5 px-3 text-sm">
                        <Briefcase className="h-3.5 w-3.5"/>
                        <span>Profile</span>
                    </TabsTrigger>
                    <TabsTrigger value="financial" className="flex items-center gap-1.5 py-1.5 px-3 text-sm">
                        <DollarSign className="h-3.5 w-3.5"/>
                        <span>Financials</span>
                    </TabsTrigger>
                    <TabsTrigger value="team" className="flex items-center gap-1.5 py-1.5 px-3 text-sm">
                        <Users className="h-3.5 w-3.5"/>
                        <span>Team</span>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-1.5 py-1.5 px-3 text-sm">
                        <Shield className="h-3.5 w-3.5"/>
                        <span>Security</span>
                    </TabsTrigger>
                    <TabsTrigger value="invoicing" className="flex items-center gap-1.5 py-1.5 px-3 text-sm">
                        <FileText className="h-3.5 w-3.5"/>
                        <span>Invoicing</span>
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile" className="space-y-6">
                    <BusinessProfileSettings />
                </TabsContent>
                
                <TabsContent value="financial" className="space-y-6">
                    <BusinessFinancialSettings />
                </TabsContent>
                
                <TabsContent value="team" className="space-y-6">
                    <BusinessTeamSettings />
                </TabsContent>
                
                <TabsContent value="security" className="space-y-6">
                    <BusinessSecuritySettings />
                </TabsContent>
                
                <TabsContent value="invoicing" className="space-y-6">
                    <BusinessInvoiceSettings />
                </TabsContent>
            </Tabs>
        </div>
    );
}
