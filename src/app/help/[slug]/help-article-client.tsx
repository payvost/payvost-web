'use client';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Content } from '@/services/contentService';
import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';

interface HelpArticleClientProps {
  article: Content;
  publishedDate: string;
}

export default function HelpArticleClient({ article, publishedDate }: HelpArticleClientProps) {
  const [helpful, setHelpful] = useState<'yes' | 'no' | null>(null);

  // Track view count (fire and forget)
  useEffect(() => {
    fetch(`/api/content/${article.id}/view`, {
      method: 'POST',
    }).catch(() => {
      // Silently fail - view tracking is not critical
    });
  }, [article.id]);

  const handleHelpful = async (value: 'yes' | 'no') => {
    setHelpful(value);
    // TODO: Track helpful feedback in backend
    // For now, just update UI
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-16 lg:py-20">
        <article className="container mx-auto px-4 md:px-6 max-w-4xl">
            {/* Article Header */}
            <header className="mb-8 md:mb-12">
                <Link 
                    href="/help" 
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Help Center
                </Link>
                
                {article.category && (
                    <Badge variant="secondary" className="mb-4">{article.category}</Badge>
                )}
                
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl leading-tight mb-4">
                    {article.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    {publishedDate && (
                        <>
                            <time dateTime={article.publishedAt}>{publishedDate}</time>
                            <span>•</span>
                        </>
                    )}
                    <div className="flex items-center gap-1.5">
                        <Eye className="h-4 w-4" />
                        <span>{article.viewCount.toLocaleString()} views</span>
                    </div>
                    {article.tags.length > 0 && (
                        <>
                            <span>•</span>
                            <div className="flex flex-wrap gap-2">
                                {article.tags.map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </header>

            {/* Article Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
                <div 
                    dangerouslySetInnerHTML={{ __html: article.content }} 
                />
            </div>

            {/* Helpful Feedback */}
            <Card className="mb-8">
                <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Was this article helpful?</h3>
                    <div className="flex gap-4">
                        <Button
                            variant={helpful === 'yes' ? 'default' : 'outline'}
                            onClick={() => handleHelpful('yes')}
                            disabled={helpful !== null}
                        >
                            <ThumbsUp className="mr-2 h-4 w-4" />
                            Yes
                        </Button>
                        <Button
                            variant={helpful === 'no' ? 'default' : 'outline'}
                            onClick={() => handleHelpful('no')}
                            disabled={helpful !== null}
                        >
                            <ThumbsDown className="mr-2 h-4 w-4" />
                            No
                        </Button>
                    </div>
                    {helpful && (
                        <p className="text-sm text-muted-foreground mt-4">
                            Thank you for your feedback!
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Related Articles / Contact Support */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold mb-2">Still need help?</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Can't find what you're looking for? Our support team is here to help.
                        </p>
                        <Button variant="outline" className="w-full" asChild>
                            <Link href="/contact">
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Contact Support
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold mb-2">Browse More Articles</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Explore our help center for more answers and guides.
                        </p>
                        <Button variant="outline" className="w-full" asChild>
                            <Link href="/help">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Help Center
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Article Footer */}
            <footer className="pt-8 border-t">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                    <div>
                        <p>Last updated: {publishedDate || 'N/A'}</p>
                        <p>Author: {article.authorName}</p>
                    </div>
                    <Link href="/help" className="text-primary hover:underline">
                        ← Back to Help Center
                    </Link>
                </div>
            </footer>

        </article>
      </main>
      <SiteFooter />
    </div>
  );
}

