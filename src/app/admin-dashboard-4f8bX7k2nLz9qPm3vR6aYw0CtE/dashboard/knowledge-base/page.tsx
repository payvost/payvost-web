
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { KnowledgeBaseArticle } from '@/types/knowledge-base-article';
import Link from 'next/link';

const sampleArticles: KnowledgeBaseArticle[] = [
    { id: 'kb_1', title: 'How to Track Your Transfer', slug: 'how-to-track-your-transfer', content: '', category: 'Payments', tags: ['tracking', 'transfer'], status: 'Published', createdAt: '2024-08-10', updatedAt: '2024-08-12', author: 'Admin User', versionHistory: [] },
    { id: 'kb_2', title: 'Understanding Our Fees', slug: 'understanding-our-fees', content: '', category: 'Pricing', tags: ['fees', 'cost'], status: 'Published', createdAt: '2024-08-09', updatedAt: '2024-08-11', author: 'Admin User', versionHistory: [] },
    { id: 'kb_3', title: 'Securing Your Account with 2FA', slug: 'securing-your-account-with-2fa', content: '', category: 'Security', tags: ['2fa', 'authentication'], status: 'Draft', createdAt: '2024-08-15', updatedAt: '2024-08-15', author: 'Support Staff', versionHistory: [] },
    { id: 'kb_4', title: 'Guide to Virtual Cards', slug: 'guide-to-virtual-cards', content: '', category: 'Cards', tags: ['virtual cards', 'spending'], status: 'Published', createdAt: '2024-07-25', updatedAt: '2024-08-01', author: 'Admin User', versionHistory: [] },
    { id: 'kb_5', title: 'API Integration for Developers', slug: 'api-integration-for-developers', content: '', category: 'Developers', tags: ['api', 'sdk'], status: 'Archived', createdAt: '2024-06-01', updatedAt: '2024-07-15', author: 'Admin User', versionHistory: [] },
];

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  Published: 'default',
  Draft: 'secondary',
  Archived: 'outline',
};

export default function KnowledgeBasePage() {
    const router = useRouter();

    const renderArticlesTable = (articles: KnowledgeBaseArticle[]) => (
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {articles.map((article) => (
                    <TableRow key={article.id} onClick={() => router.push(`/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/knowledge-base/${article.id}`)} className="cursor-pointer">
                        <TableCell>
                            <div className="font-medium">{article.title}</div>
                            <div className="text-xs text-muted-foreground">{article.tags.join(', ')}</div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{article.category}</Badge></TableCell>
                        <TableCell><Badge variant={statusVariant[article.status]}>{article.status}</Badge></TableCell>
                        <TableCell>{article.updatedAt}</TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Toggle menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>Edit Article</DropdownMenuItem>
                                    <DropdownMenuItem>View on Site</DropdownMenuItem>
                                    <DropdownMenuItem>Archive</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
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
                    <h2 className="text-3xl font-bold tracking-tight">Knowledge Base</h2>
                    <p className="text-muted-foreground">Manage help articles, guides, and FAQs.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button onClick={() => router.push('/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/dashboard/knowledge-base/new')}><PlusCircle className="mr-2 h-4 w-4" />New Article</Button>
                </div>
            </div>

            <Tabs defaultValue="published">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <TabsList>
                                <TabsTrigger value="published">Published</TabsTrigger>
                                <TabsTrigger value="drafts">Drafts</TabsTrigger>
                                <TabsTrigger value="archived">Archived</TabsTrigger>
                            </TabsList>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input type="search" placeholder="Search articles..." className="w-full rounded-lg bg-background pl-8 md:w-[320px]" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <TabsContent value="published">
                            {renderArticlesTable(sampleArticles.filter(a => a.status === 'Published'))}
                        </TabsContent>
                         <TabsContent value="drafts">
                            {renderArticlesTable(sampleArticles.filter(a => a.status === 'Draft'))}
                        </TabsContent>
                         <TabsContent value="archived">
                            {renderArticlesTable(sampleArticles.filter(a => a.status === 'Archived'))}
                        </TabsContent>
                    </CardContent>
                </Card>
            </Tabs>
        </>
    );
}
