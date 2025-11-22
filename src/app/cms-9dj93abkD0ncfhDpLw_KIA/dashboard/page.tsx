'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileText, BookOpen, Newspaper, FileCode, TrendingUp, Eye } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface ContentStats {
  total: number;
  published: number;
  draft: number;
  byType: {
    blog: number;
    press: number;
    docs: number;
    knowledgeBase: number;
  };
}

export default function WriterDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<ContentStats>({
    total: 0,
    published: 0,
    draft: 0,
    byType: {
      blog: 0,
      press: 0,
      docs: 0,
      knowledgeBase: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch actual stats from API
    // For now, using placeholder data
    setStats({
      total: 24,
      published: 18,
      draft: 6,
      byType: {
        blog: 12,
        press: 5,
        docs: 4,
        knowledgeBase: 3,
      },
    });
    setLoading(false);
  }, []);

  const quickActions = [
    {
      title: 'New Blog Post',
      description: 'Create a new blog article',
      icon: <BookOpen className="h-5 w-5" />,
      href: '/cms-9dj93abkD0ncfhDpLw_KIA/dashboard/content/blog/new',
      color: 'bg-blue-500',
    },
    {
      title: 'Press Release',
      description: 'Write a press release',
      icon: <Newspaper className="h-5 w-5" />,
      href: '/cms-9dj93abkD0ncfhDpLw_KIA/dashboard/content/press/new',
      color: 'bg-green-500',
    },
    {
      title: 'Documentation',
      description: 'Add documentation',
      icon: <FileCode className="h-5 w-5" />,
      href: '/cms-9dj93abkD0ncfhDpLw_KIA/dashboard/content/docs/new',
      color: 'bg-purple-500',
    },
    {
      title: 'Knowledge Base',
      description: 'Create help article',
      icon: <FileText className="h-5 w-5" />,
      href: '/cms-9dj93abkD0ncfhDpLw_KIA/dashboard/content/knowledge-base/new',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your blog posts, press releases, documentation, and knowledge base articles.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All content items</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published}</div>
            <p className="text-xs text-muted-foreground">Live on site</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2K</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Card key={action.title} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center text-white mb-2`}>
                  {action.icon}
                </div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={action.href}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Content */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Content</CardTitle>
          <CardDescription>Your recently created or edited content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent content. Create your first piece!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

