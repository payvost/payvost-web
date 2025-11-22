'use client';

import { SiteHeader } from '@/components/site-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { 
    Bookmark,
    Link as LinkIcon,
    Twitter,
    Linkedin,
    Facebook,
    ArrowLeft,
    Eye
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { SiteFooter } from '@/components/site-footer';
import { Content } from '@/services/contentService';
import { useEffect } from 'react';

interface ArticleClientProps {
  article: Content;
  readingTime: string;
  publishedDate: string;
}

export default function ArticleClient({ article, readingTime, publishedDate }: ArticleClientProps) {
  // Track view count (fire and forget)
  useEffect(() => {
    // Increment view count in background
    fetch(`/api/content/${article.id}/view`, {
      method: 'POST',
    }).catch(() => {
      // Silently fail - view tracking is not critical
    });
  }, [article.id]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = article.title;
  const shareText = article.excerpt || '';

  const handleShare = (platform: string) => {
    const url = encodeURIComponent(shareUrl);
    const title = encodeURIComponent(shareTitle);
    const text = encodeURIComponent(shareText);

    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      // You could show a toast notification here
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-16 lg:py-20">
        <article className="container mx-auto px-4 md:px-6 max-w-5xl">
            {/* Article Header */}
            <header className="mb-8 md:mb-12 text-center">
                {article.category && (
                    <div className="mb-4">
                        <Badge variant="secondary">{article.category}</Badge>
                    </div>
                )}
                {article.tags.length > 0 && (
                    <div className="mb-4">
                        {article.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="mr-2">{tag}</Badge>
                        ))}
                    </div>
                )}
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl leading-tight">
                    {article.title}
                </h1>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>{article.authorName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{article.authorName}</span>
                    </div>
                    {publishedDate && (
                        <>
                            <span className="hidden md:inline-block">|</span>
                            <time dateTime={article.publishedAt} className="text-sm">{publishedDate}</time>
                        </>
                    )}
                    <span className="hidden md:inline-block">|</span>
                    <span className="text-sm">{readingTime}</span>
                    <span className="hidden md:inline-block">|</span>
                    <div className="flex items-center gap-1.5 text-sm">
                        <Eye className="h-4 w-4" />
                        <span>{article.viewCount.toLocaleString()} Views</span>
                    </div>
                </div>
            </header>

            {/* Featured Image */}
            {article.featuredImage && (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-8 md:mb-12">
                    <Image 
                        src={article.featuredImage} 
                        alt={article.title} 
                        fill 
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" 
                        className="object-cover" 
                    />
                </div>
            )}

            {/* Content and Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-12">
                {/* Social Share Sidebar */}
                <aside className="lg:col-span-2 hidden lg:block">
                    <div className="sticky top-28 space-y-4">
                        <h3 className="font-semibold text-sm uppercase text-muted-foreground">Share</h3>
                        <Button variant="outline" size="icon" onClick={() => handleShare('twitter')}>
                            <Twitter className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleShare('linkedin')}>
                            <Linkedin className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleShare('facebook')}>
                            <Facebook className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleCopyLink}>
                            <LinkIcon className="h-4 w-4" />
                        </Button>
                        <Separator />
                        <Button variant="outline" size="icon">
                            <Bookmark className="h-4 w-4" />
                        </Button>
                    </div>
                </aside>

                {/* Article Content */}
                <div className="lg:col-span-10">
                    <div 
                        className="prose prose-lg dark:prose-invert max-w-none" 
                        dangerouslySetInnerHTML={{ __html: article.content }} 
                    />
                </div>
            </div>

            {/* Article Footer */}
            <footer className="mt-12 md:mt-16">
                <Separator />
                <div className="py-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <Link href="/blog" className="flex items-center text-primary hover:underline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Blog
                    </Link>
                    <div className="flex items-center gap-4">
                        <p className="font-semibold text-sm">Share this article:</p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleShare('twitter')}>
                                <Twitter className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => handleShare('linkedin')}>
                                <Linkedin className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => handleShare('facebook')}>
                                <Facebook className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </footer>

        </article>
      </main>
      <SiteFooter />
    </div>
  );
}

