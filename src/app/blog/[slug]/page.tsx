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
