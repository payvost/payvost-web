'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, MoreHorizontal, Search, Eye, Edit, Trash2, FileText } from 'lucide-react';
import Link from 'next/link';

interface ContentItem {
  id: string;
  title: string;
  contentType: 'BLOG' | 'PRESS_RELEASE' | 'DOCUMENTATION' | 'KNOWLEDGE_BASE';
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  author: string;
  updatedAt: string;
  publishedAt?: string;
}

export default function ContentListPage() {
  const router = useRouter();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    // TODO: Fetch from API
    // Placeholder data
    setContent([
      {
        id: '1',
        title: 'How to Send Money Internationally',
        contentType: 'BLOG',
        status: 'PUBLISHED',
        author: 'John Doe',
        updatedAt: '2024-01-15',
        publishedAt: '2024-01-10',
      },
      {
        id: '2',
        title: 'Payvost Launches New Features',
        contentType: 'PRESS_RELEASE',
        status: 'DRAFT',
        author: 'Jane Smith',
        updatedAt: '2024-01-14',
      },
    ]);
    setLoading(false);
  }, []);

  const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    PUBLISHED: 'default',
    DRAFT: 'secondary',
    REVIEW: 'outline',
    ARCHIVED: 'outline',
  };

  const typeLabels: Record<string, string> = {
    BLOG: 'Blog',
    PRESS_RELEASE: 'Press',
    DOCUMENTATION: 'Docs',
    KNOWLEDGE_BASE: 'KB',
  };

  const filteredContent = content.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Content</h1>
          <p className="text-muted-foreground">
            Manage all your content in one place
          </p>
        </div>
        <Button onClick={() => router.push('/cms-9dj93abkD0ncfhDpLw_KIA/dashboard/content/new')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Content
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="PUBLISHED">Published</TabsTrigger>
                <TabsTrigger value="DRAFT">Drafts</TabsTrigger>
                <TabsTrigger value="REVIEW">Review</TabsTrigger>
                <TabsTrigger value="ARCHIVED">Archived</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search content..."
                className="w-full rounded-lg bg-background pl-8 md:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredContent.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No content found. Create your first piece!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContent.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{typeLabels[item.contentType]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[item.status]}>{item.status}</Badge>
                    </TableCell>
                    <TableCell>{item.author}</TableCell>
                    <TableCell>{new Date(item.updatedAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/cms-9dj93abkD0ncfhDpLw_KIA/dashboard/content/${item.id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          {item.status === 'PUBLISHED' && (
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
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
  );
}

