
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Bot, Sparkles, BookOpen, Clock, Tag } from 'lucide-react';
import type { KnowledgeBaseArticle } from '@/types/knowledge-base-article';
import { useToast } from '@/hooks/use-toast';

const sampleArticle: KnowledgeBaseArticle = {
    id: 'kb_1',
    title: 'How to Track Your Transfer',
    slug: 'how-to-track-your-transfer',
    content: '<p>You can easily track your transfer in real-time right from your dashboard. Navigate to the <strong>Transactions</strong> tab from the main menu. Here you will see a list of all your recent transfers.</p><p>Each transaction has a status badge, such as "Completed", "Processing", or "Failed". Click on any transaction to view more detailed information and a complete timeline of its progress.</p>',
    category: 'Payments',
    tags: ['tracking', 'transfer', 'status'],
    status: 'Published',
    createdAt: '2024-08-10',
    updatedAt: '2024-08-12',
    author: 'Admin User',
    versionHistory: []
};

export default function ArticleEditorPage() {
    const params = useParams();
    const id = params.id as string;
    const isNew = id === 'new';
    
    const [article, setArticle] = useState(isNew ? { title: '', content: '', category: '', tags: [], status: 'Draft' } as Partial<KnowledgeBaseArticle> : sampleArticle);
    const { toast } = useToast();

    const handleSave = () => {
        toast({
            title: isNew ? 'Article Created' : 'Article Updated',
            description: `"${article.title}" has been saved as a draft.`,
        })
    }
    
    const handlePublish = () => {
         toast({
            title: 'Article Published!',
            description: `"${article.title}" is now live on the help center.`,
        })
    }

    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                        <Link href="/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/knowledge-base">
                           <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{isNew ? 'Create New Article' : 'Edit Article'}</h2>
                        <p className="text-muted-foreground">Manage content for your help center.</p>
                    </div>
                </div>
                 <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={handleSave}>Save Draft</Button>
                    <Button onClick={handlePublish}><Save className="mr-2 h-4 w-4"/>Save & Publish</Button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Article Content</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Article Title</Label>
                                <Input id="title" value={article.title} onChange={e => setArticle(p => ({...p, title: e.target.value}))} placeholder="e.g., How to Create a Virtual Card"/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="content">Content</Label>
                                <Textarea id="content" value={article.content} onChange={e => setArticle(p => ({...p, content: e.target.value}))} placeholder="Write your article content here... (supports Markdown)" rows={15}/>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5"/>AI Assistant</CardTitle>
                             <CardDescription>Use AI to help you write and refine your content.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <Textarea placeholder="Ask the AI to generate or improve content. For example: 'Write an introduction about transfer fees.' or 'Make the selected text more friendly.'"/>
                           <Button><Sparkles className="mr-2 h-4 w-4"/>Generate Content</Button>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5"/>Publication Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={article.status} onValueChange={val => setArticle(p => ({...p, status: val as any}))}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Published">Published</SelectItem>
                                        <SelectItem value="Draft">Draft</SelectItem>
                                        <SelectItem value="Archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select value={article.category} onValueChange={val => setArticle(p => ({...p, category: val as any}))}>
                                    <SelectTrigger><SelectValue placeholder="Select a category..."/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Payments">Payments</SelectItem>
                                        <SelectItem value="Security">Security</SelectItem>
                                        <SelectItem value="Cards">Cards</SelectItem>
                                        <SelectItem value="Developers">Developers</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tags">Tags</Label>
                                <Input id="tags" value={article.tags?.join(', ')} onChange={e => setArticle(p => ({...p, tags: e.target.value.split(',').map(t => t.trim())}))} placeholder="tracking, fees, 2fa"/>
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5"/>Version History</CardTitle></CardHeader>
                        <CardContent>
                            {isNew ? (
                                <p className="text-sm text-muted-foreground">This is a new article. History will be tracked after the first save.</p>
                            ) : (
                                <ul className="space-y-2 text-sm">
                                    <li className="flex justify-between"><span>Last updated:</span><span className="font-medium">{sampleArticle.updatedAt}</span></li>
                                    <li className="flex justify-between"><span>Created:</span><span className="font-medium">{sampleArticle.createdAt}</span></li>
                                    <li className="flex justify-between"><span>Author:</span><span className="font-medium">{sampleArticle.author}</span></li>
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
