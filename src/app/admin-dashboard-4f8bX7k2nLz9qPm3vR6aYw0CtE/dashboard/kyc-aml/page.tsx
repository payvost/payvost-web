
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2 } from 'lucide-react';

const tier1Docs = [
  { id: 'doc_1', name: 'Email Verification', required: true, type: 'Automated' },
  { id: 'doc_2', name: 'Phone Verification', required: true, type: 'Automated' },
  { id: 'doc_3', name: 'Full Name & DOB', required: true, type: 'Manual' },
];

const tier2Docs = [
  ...tier1Docs,
  { id: 'doc_4', name: 'Government-Issued ID', required: true, type: 'Manual' },
  { id: 'doc_5', name: 'Proof of Address (Utility Bill)', required: true, type: 'Manual' },
];

const tier3Docs = [
    ...tier2Docs,
    { id: 'doc_6', name: 'Source of Funds Declaration', required: true, type: 'Manual' },
    { id: 'doc_7', name: 'Video Verification Call', required: false, type: 'Manual' },
];

const regionalConfigs = [
    { region: 'Global Default', tier: 'Tier 1' },
    { region: 'Europe (GDPR)', tier: 'Tier 2' },
    { region: 'USA (FinCEN)', tier: 'Tier 2' },
    { region: 'Nigeria', tier: 'Tier 1' },
]


export default function KycAmlPage() {

    const renderTierDocs = (docs: typeof tier1Docs) => (
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Document / Check</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {docs.map(doc => (
                    <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.name}</TableCell>
                        <TableCell>{doc.type}</TableCell>
                        <TableCell><Checkbox defaultChecked={doc.required} /></TableCell>
                        <TableCell className="text-right">
                           <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );

    return (
        <>
             <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">KYC & AML Configuration</h2>
                    <p className="text-muted-foreground">Define verification tiers, required documents, and regional policies.</p>
                </div>
                 <div className="flex items-center space-x-2">
                    <Button variant="outline">View Audit Log</Button>
                    <Button>Save All Changes</Button>
                </div>
            </div>

            <Tabs defaultValue="levels" className="w-full">
                <TabsList>
                    <TabsTrigger value="levels">Verification Levels</TabsTrigger>
                    <TabsTrigger value="regions">Regional Policies</TabsTrigger>
                </TabsList>
                <TabsContent value="levels" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Verification Tiers</CardTitle>
                            <CardDescription>Define the documents and checks required for each level of user verification.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Tabs defaultValue="tier1" orientation="vertical">
                                <div className="grid grid-cols-4 gap-6">
                                    <TabsList className="flex-col h-auto items-start">
                                        <TabsTrigger value="tier1" className="w-full justify-start">Tier 1 (Basic)</TabsTrigger>
                                        <TabsTrigger value="tier2" className="w-full justify-start">Tier 2 (Verified)</TabsTrigger>
                                        <TabsTrigger value="tier3" className="w-full justify-start">Tier 3 (Enhanced)</TabsTrigger>
                                    </TabsList>
                                    <div className="col-span-3">
                                        <TabsContent value="tier1">
                                            {renderTierDocs(tier1Docs)}
                                        </TabsContent>
                                        <TabsContent value="tier2">
                                            {renderTierDocs(tier2Docs)}
                                        </TabsContent>
                                         <TabsContent value="tier3">
                                            {renderTierDocs(tier3Docs)}
                                        </TabsContent>
                                    </div>
                                </div>
                             </Tabs>
                        </CardContent>
                         <CardFooter>
                            <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4"/>Add New Requirement</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="regions" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Regional Policies</CardTitle>
                            <CardDescription>Assign default verification levels to different regions to comply with local regulations.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Region</TableHead>
                                        <TableHead>Default KYC Tier</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {regionalConfigs.map(region => (
                                        <TableRow key={region.region}>
                                            <TableCell className="font-medium">{region.region}</TableCell>
                                            <TableCell>{region.tier}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm">Edit</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4"/>Add Regional Policy</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </>
    );
}
