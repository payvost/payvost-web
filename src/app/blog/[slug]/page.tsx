import { SiteHeader } from '@/components/site-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import Image from 'next/image';
import Link from 'next/link';
import { 
    Bookmark,
    Share2,
    Link as LinkIcon,
    ArrowRight,
    Twitter,
    Linkedin,
    Facebook,
    ArrowLeft,
    Eye,
    Loader2
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { SiteFooter } from '@/components/site-footer';
import { contentService, Content } from '@/services/contentService';
import { format } from 'date-fns';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ArticleClient from './article-client';

// Calculate reading time from content
function calculateReadingTime(content: string): string {
  const wordsPerMinute = 200;
  const text = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
  const words = text.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const article = await contentService.getBySlug(params.slug);
    
    if (!article || article.contentType !== 'BLOG' || article.status !== 'PUBLISHED') {
      return {
        title: 'Article Not Found',
      };
    }

    return {
      title: article.metaTitle || article.title,
      description: article.metaDescription || article.excerpt || '',
      keywords: article.metaKeywords,
      openGraph: {
        title: article.metaTitle || article.title,
        description: article.metaDescription || article.excerpt || '',
        type: 'article',
        publishedTime: article.publishedAt || undefined,
        authors: [article.authorName],
        images: article.featuredImage ? [article.featuredImage] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: article.metaTitle || article.title,
        description: article.metaDescription || article.excerpt || '',
        images: article.featuredImage ? [article.featuredImage] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Article Not Found',
    };
  }
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  let article: Content;
  
  try {
    article = await contentService.getBySlug(params.slug);
    
    if (!article || article.contentType !== 'BLOG' || article.status !== 'PUBLISHED') {
      notFound();
    }
  } catch (error) {
    console.error('Error fetching article:', error);
    notFound();
  }

  const readingTime = calculateReadingTime(article.content);
  const publishedDate = article.publishedAt ? format(new Date(article.publishedAt), 'MMMM dd, yyyy') : '';
  
  return <ArticleClient article={article} readingTime={readingTime} publishedDate={publishedDate} />;
}

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-16 lg:py-20">
        <article className="container mx-auto px-4 md:px-6 max-w-5xl">
            {/* Article Header */}
            <header className="mb-8 md:mb-12 text-center">
                <div className="mb-4">
                    {tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="mr-2">{tag}</Badge>
                    ))}
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl leading-tight">
                    {title}
                </h1>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={author.avatar} data-ai-hint={author.avatarHint} alt={author.name} />
                            <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{author.name}</span>
                    </div>
                    <span className="hidden md:inline-block">|</span>
                    <time dateTime={publishedAt} className="text-sm">{publishedAt}</time>
                    <span className="hidden md:inline-block">|</span>
                    <span className="text-sm">{readingTime}</span>
                     <span className="hidden md:inline-block">|</span>
                    <div className="flex items-center gap-1.5 text-sm">
                        <Eye className="h-4 w-4" />
                        <span>37.6k Views</span>
                    </div>
                </div>
            </header>

            {/* Featured Image */}
            <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-8 md:mb-12">
                <Image src={featuredImage} alt={title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover" />
            </div>

            {/* Content and Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-12">
                {/* Social Share Sidebar */}
                <aside className="lg:col-span-2 hidden lg:block">
                    <div className="sticky top-28 space-y-4">
                        <h3 className="font-semibold text-sm uppercase text-muted-foreground">Share</h3>
                         <Button variant="outline" size="icon"><Twitter className="h-4 w-4" /></Button>
                         <Button variant="outline" size="icon"><Linkedin className="h-4 w-4" /></Button>
                         <Button variant="outline" size="icon"><Facebook className="h-4 w-4" /></Button>
                         <Button variant="outline" size="icon"><LinkIcon className="h-4 w-4" /></Button>
                        <Separator />
                        <Button variant="outline" size="icon"><Bookmark className="h-4 w-4" /></Button>
                    </div>
                </aside>

                {/* Article Content */}
                <div className="lg:col-span-10">
                    <div className="prose prose-lg dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
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
                             <Button variant="outline" size="icon"><Twitter className="h-4 w-4" /></Button>
                             <Button variant="outline" size="icon"><Linkedin className="h-4 w-4" /></Button>
                             <Button variant="outline" size="icon"><Facebook className="h-4 w-4" /></Button>
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
