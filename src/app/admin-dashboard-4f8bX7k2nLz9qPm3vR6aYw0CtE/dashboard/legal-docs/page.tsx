
'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Save, History, GitCompareArrows } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LegalDocumentEditor } from '@/components/legal-document-editor';

const termsVersions = [
    { version: 'v2.1', status: 'Published', date: '2024-08-01', editor: 'Admin User' },
    { version: 'v2.0', status: 'Archived', date: '2024-01-15', editor: 'Admin User' },
    { version: 'v1.5', status: 'Archived', date: '2023-06-20', editor: 'Admin User' },
];

const privacyVersions = [
    { version: 'v1.2', status: 'Published', date: '2024-05-25', editor: 'Admin User' },
    { version: 'v1.1', status: 'Archived', date: '2023-12-10', editor: 'Admin User' },
];


export default function LegalDocsPage() {
    const { toast } = useToast();
    const [termsContent, setTermsContent] = useState('<h1>Terms of Service</h1><p>This is the current content of the Terms of Service. By using our service, you agree to these terms...</p>');
    const [privacyContent, setPrivacyContent] = useState('<h1>Privacy Policy</h1><p>This is the current content of the Privacy Policy. We are committed to protecting your privacy...</p>');

    const handlePublish = (docName: string) => {
        toast({
            title: "Document Published",
            description: `A new version of the ${docName} has been published.`
        })
    }

    const handleSaveDraft = (docName: string) => {
        toast({
            title: "Draft Saved",
            description: `Your changes to ${docName} have been saved as a draft.`
        })
    }

    const renderDocumentManager = (docName: string, versions: typeof termsVersions, content: string, setContent: (content: string) => void) => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Edit {docName}</CardTitle>
                        <CardDescription>Current version: {versions[0].version}. Make changes below to create a new version.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LegalDocumentEditor
                            value={content}
                            onChange={setContent}
                            placeholder={`Start editing your ${docName}...`}
                        />
                    </CardContent>
                    <CardFooter className="justify-end gap-2">
                        <Button variant="outline" onClick={() => handleSaveDraft(docName)}>Save as Draft</Button>
                        <Button onClick={() => handlePublish(docName)}><Save className="mr-2 h-4 w-4"/>Publish New Version</Button>
                    </CardFooter>
                </Card>
            </div>
             <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" />Version History</CardTitle>
                        <CardDescription>Review and manage past versions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Version</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {versions.map(v => (
                                    <TableRow key={v.version}>
                                        <TableCell>
                                            <div className="font-medium">{v.version}</div>
                                            <div className="text-xs text-muted-foreground">{v.date}</div>
                                        </TableCell>
                                        <TableCell><Badge variant={v.status === 'Published' ? 'default' : 'secondary'}>{v.status}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem>View Content</DropdownMenuItem>
                                                    <DropdownMenuItem>Compare to Current</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-orange-500">Rollback to this Version</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
    
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Legal Document Management</h2>
                    <p className="text-muted-foreground">Manage versions of your Terms of Service and Privacy Policy.</p>
                </div>
            </div>

            <Tabs defaultValue="terms">
                <TabsList>
                    <TabsTrigger value="terms">Terms of Service</TabsTrigger>
                    <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
                </TabsList>

                <TabsContent value="terms" className="mt-6">
                    {renderDocumentManager(
                        'Terms of Service', 
                        termsVersions, 
                        termsContent,
                        setTermsContent
                    )}
                </TabsContent>
                 <TabsContent value="privacy" className="mt-6">
                    {renderDocumentManager(
                        'Privacy Policy', 
                        privacyVersions, 
                        privacyContent,
                        setPrivacyContent
                    )}
                </TabsContent>
            </Tabs>
        </>
    );
}
