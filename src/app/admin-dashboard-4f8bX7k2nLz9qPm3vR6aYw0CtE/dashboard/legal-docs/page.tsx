
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MoreHorizontal, FileText, Save, History, GitCompareArrows, Eye, RotateCcw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LegalDocumentEditor } from '@/components/legal-document-editor';
import { useAuth } from '@/hooks/use-auth';

interface Version {
    id: string;
    version: string;
    status: 'published' | 'draft' | 'archived';
    date: string;
    editor: string;
    content?: string;
    versionNumber: number;
}

export default function LegalDocsPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [termsContent, setTermsContent] = useState('');
    const [privacyContent, setPrivacyContent] = useState('');
    const [termsVersions, setTermsVersions] = useState<Version[]>([]);
    const [privacyVersions, setPrivacyVersions] = useState<Version[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [compareDialogOpen, setCompareDialogOpen] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
    const [currentDocType, setCurrentDocType] = useState<'terms' | 'privacy'>('terms');

    // Load documents on mount
    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        setLoading(true);
        try {
            // Load current published versions
            const [termsRes, privacyRes] = await Promise.all([
                fetch('/api/admin/legal-docs?type=terms'),
                fetch('/api/admin/legal-docs?type=privacy')
            ]);

            if (termsRes.ok) {
                const termsData = await termsRes.json();
                setTermsContent(termsData.content || '<h1>Terms of Service</h1><p>Start editing...</p>');
            }

            if (privacyRes.ok) {
                const privacyData = await privacyRes.json();
                setPrivacyContent(privacyData.content || '<h1>Privacy Policy</h1><p>Start editing...</p>');
            }

            // Load all versions
            await loadVersions();
        } catch (error) {
            console.error('Error loading documents:', error);
            toast({
                title: 'Error',
                description: 'Failed to load documents',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const loadVersions = async () => {
        try {
            const [termsRes, privacyRes] = await Promise.all([
                fetch('/api/admin/legal-docs?type=terms&allVersions=true'),
                fetch('/api/admin/legal-docs?type=privacy&allVersions=true')
            ]);

            if (termsRes.ok) {
                const termsData = await termsRes.json();
                setTermsVersions(termsData.versions.map((v: any) => ({
                    id: v.id,
                    version: v.version,
                    status: v.status,
                    date: v.publishedAt || v.createdAt,
                    editor: v.editor || 'Admin User',
                    content: v.content,
                    versionNumber: v.versionNumber
                })));
            }

            if (privacyRes.ok) {
                const privacyData = await privacyRes.json();
                setPrivacyVersions(privacyData.versions.map((v: any) => ({
                    id: v.id,
                    version: v.version,
                    status: v.status,
                    date: v.publishedAt || v.createdAt,
                    editor: v.editor || 'Admin User',
                    content: v.content,
                    versionNumber: v.versionNumber
                })));
            }
        } catch (error) {
            console.error('Error loading versions:', error);
        }
    };

    const handlePublish = async (docType: 'terms' | 'privacy', docName: string) => {
        setSaving(true);
        try {
            const content = docType === 'terms' ? termsContent : privacyContent;
            const response = await fetch('/api/admin/legal-docs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: docType,
                    content,
                    publish: true,
                    editor: user?.displayName || user?.email || 'Admin User'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to publish document');
            }

            await loadVersions();
            toast({
                title: "Document Published",
                description: `A new version of the ${docName} has been published and is now live.`
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || 'Failed to publish document',
                variant: 'destructive'
            });
        } finally {
            setSaving(false);
        }
    }

    const handleSaveDraft = async (docType: 'terms' | 'privacy', docName: string) => {
        setSaving(true);
        try {
            const content = docType === 'terms' ? termsContent : privacyContent;
            const response = await fetch('/api/admin/legal-docs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: docType,
                    content,
                    status: 'draft',
                    publish: false,
                    editor: user?.displayName || user?.email || 'Admin User'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save draft');
            }

            await loadVersions();
            toast({
                title: "Draft Saved",
                description: `Your changes to ${docName} have been saved as a draft.`
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || 'Failed to save draft',
                variant: 'destructive'
            });
        } finally {
            setSaving(false);
        }
    }

    const handleViewContent = (version: Version) => {
        setSelectedVersion(version);
        setViewDialogOpen(true);
    }

    const handleCompare = (version: Version, docType: 'terms' | 'privacy') => {
        setSelectedVersion(version);
        setCurrentDocType(docType);
        setCompareDialogOpen(true);
    }

    const handleRollback = async (version: Version, docType: 'terms' | 'privacy', docName: string) => {
        try {
            const response = await fetch('/api/admin/legal-docs', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    versionId: version.id,
                    action: 'rollback',
                    editor: user?.displayName || user?.email || 'Admin User'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to rollback version');
            }

            // Reload documents and versions
            await loadDocuments();
            toast({
                title: "Version Rolled Back",
                description: `${docName} has been rolled back to ${version.version} and is now published.`
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || 'Failed to rollback version',
                variant: 'destructive'
            });
        }
    }

    const renderDocumentManager = (docType: 'terms' | 'privacy', docName: string, versions: Version[], content: string, setContent: (content: string) => void) => {
        const currentVersion = versions.find(v => v.status === 'published') || versions[0];
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Edit {docName}</CardTitle>
                            <CardDescription>
                                {currentVersion ? `Current version: ${currentVersion.version}. Make changes below to create a new version.` : 'Start creating your first version.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center h-[500px]">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            ) : (
                                <LegalDocumentEditor
                                    value={content}
                                    onChange={setContent}
                                    placeholder={`Start editing your ${docName}...`}
                                />
                            )}
                        </CardContent>
                        <CardFooter className="justify-end gap-2">
                            <Button 
                                variant="outline" 
                                onClick={() => handleSaveDraft(docType, docName)}
                                disabled={saving || loading}
                            >
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Save as Draft
                            </Button>
                            <Button 
                                onClick={() => handlePublish(docType, docName)}
                                disabled={saving || loading}
                            >
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Publish New Version
                            </Button>
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
                            {loading ? (
                                <div className="flex items-center justify-center h-32">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : versions.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">No versions yet</p>
                            ) : (
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
                                            <TableRow key={v.id}>
                                                <TableCell>
                                                    <div className="font-medium">{v.version}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {v.date ? new Date(v.date).toLocaleDateString() : 'N/A'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={v.status === 'published' ? 'default' : v.status === 'draft' ? 'outline' : 'secondary'}>
                                                        {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuItem onClick={() => handleViewContent(v)}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View Content
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleCompare(v, docType)}>
                                                                <GitCompareArrows className="mr-2 h-4 w-4" />
                                                                Compare to Current
                                                            </DropdownMenuItem>
                                                            {v.status !== 'published' && (
                                                                <DropdownMenuItem 
                                                                    className="text-orange-500"
                                                                    onClick={() => handleRollback(v, docType, docName)}
                                                                >
                                                                    <RotateCcw className="mr-2 h-4 w-4" />
                                                                    Rollback to this Version
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }
    
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
                        'terms',
                        'Terms of Service', 
                        termsVersions, 
                        termsContent,
                        setTermsContent
                    )}
                </TabsContent>
                 <TabsContent value="privacy" className="mt-6">
                    {renderDocumentManager(
                        'privacy',
                        'Privacy Policy', 
                        privacyVersions, 
                        privacyContent,
                        setPrivacyContent
                    )}
                </TabsContent>
            </Tabs>

            {/* View Content Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>Version Content - {selectedVersion?.version}</DialogTitle>
                        <DialogDescription>
                            Viewing content from {selectedVersion?.date ? new Date(selectedVersion.date).toLocaleDateString() : 'N/A'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="overflow-auto max-h-[60vh] prose dark:prose-invert">
                        {selectedVersion?.content ? (
                            <div dangerouslySetInnerHTML={{ __html: selectedVersion.content }} />
                        ) : (
                            <p className="text-muted-foreground">No content available</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Compare Dialog */}
            <Dialog open={compareDialogOpen} onOpenChange={setCompareDialogOpen}>
                <DialogContent className="max-w-6xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>Compare Versions</DialogTitle>
                        <DialogDescription>
                            Comparing {selectedVersion?.version} with current published version
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 overflow-auto max-h-[60vh]">
                        <div>
                            <h3 className="font-semibold mb-2">Version {selectedVersion?.version}</h3>
                            <div className="prose dark:prose-invert text-sm">
                                {selectedVersion?.content ? (
                                    <div dangerouslySetInnerHTML={{ __html: selectedVersion.content }} />
                                ) : (
                                    <p className="text-muted-foreground">No content available</p>
                                )}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Current Published Version</h3>
                            <div className="prose dark:prose-invert text-sm">
                                {currentDocType === 'terms' ? (
                                    <div dangerouslySetInnerHTML={{ __html: termsContent }} />
                                ) : (
                                    <div dangerouslySetInnerHTML={{ __html: privacyContent }} />
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCompareDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
