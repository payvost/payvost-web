'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import ContentListPage from '../page';

export default function BlogPostsPage() {
  const router = useRouter();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Posts</h1>
          <p className="text-muted-foreground">
            Create and manage blog articles
          </p>
        </div>
        <Button onClick={() => router.push('/cms-9dj93abkD0ncfhDpLw_KIA/dashboard/content/blog/new')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Blog Post
        </Button>
      </div>
      <ContentListPage />
    </div>
  );
}

