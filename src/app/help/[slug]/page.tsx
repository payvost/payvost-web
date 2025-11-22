import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { contentService, Content } from '@/services/contentService';
import { format } from 'date-fns';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import HelpArticleClient from './help-article-client';
import { ArrowLeft, Eye } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const article = await contentService.getBySlug(params.slug);
    
    if (!article || article.contentType !== 'KNOWLEDGE_BASE' || article.status !== 'PUBLISHED') {
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
      },
    };
  } catch (error) {
    return {
      title: 'Article Not Found',
    };
  }
}

export default async function HelpArticlePage({ params }: { params: { slug: string } }) {
  let article: Content;
  
  try {
    article = await contentService.getBySlug(params.slug);
    
    if (!article || article.contentType !== 'KNOWLEDGE_BASE' || article.status !== 'PUBLISHED') {
      notFound();
    }
  } catch (error) {
    console.error('Error fetching article:', error);
    notFound();
  }

  const publishedDate = article.publishedAt ? format(new Date(article.publishedAt), 'MMMM dd, yyyy') : '';
  
  return <HelpArticleClient article={article} publishedDate={publishedDate} />;
}

