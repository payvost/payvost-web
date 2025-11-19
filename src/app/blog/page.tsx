'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { SiteFooter } from '@/components/site-footer';
import { Separator } from '@/components/ui/separator';

const articles = [
  {
    slug: 'payvost-partners-with-google',
    title: 'Payvost Partners with Google’s Anti-Money Laundering AI for Risk and Fraud Management',
    excerpt: 'A brief summary of the blog post goes here. Catch the reader\'s interest and give them a reason to click and read more about this exciting topic.',
    featuredImage: '/optimized/Payvost Building.jpg',
    category: 'Partnership',
    featured: true,
  },
  {
    slug: 'ai-in-remittance',
    title: 'The Future of Remittances: How AI is Changing the Game',
    excerpt: 'Discover the revolutionary impact of artificial intelligence on cross-border payments.',
    featuredImage: '/optimized/Payvost Building.jpg',
    imageHint: 'finance technology',
    category: 'Technology',
  },
  {
    slug: 'secure-transfers',
    title: '5 Tips for Secure International Money Transfers',
    excerpt: 'Protect your money and personal information with these essential security tips.',
    featuredImage: '/optimized/Payvost Building.jpg',
    imageHint: 'digital security',
    category: 'Security',
  },
  {
    slug: 'expanding-to-africa',
    title: 'Expanding Our Reach: Payvost Launches in Three New African Markets',
    excerpt: 'We are excited to bring our fast and secure remittance services to more people across Africa.',
    featuredImage: '/optimized/Payvost Building.jpg',
    imageHint: 'africa map',
    category: 'Company News',
  },
  {
    slug: 'understanding-fx-rates',
    title: 'Understanding FX Rates: A Guide for Smart Transfers',
    excerpt: 'Learn how foreign exchange rates work and how to get the most value from your money.',
    featuredImage: '/optimized/Payvost Building.jpg',
    imageHint: 'currency exchange chart',
    category: 'Finance',
  },
   {
    slug: 'virtual-cards-guide',
    title: 'The Ultimate Guide to Using Virtual Cards for Online Shopping',
    excerpt: 'Enhance your online security with Payvost\'s disposable virtual cards.',
    featuredImage: '/optimized/Payvost Building.jpg',
    imageHint: 'online shopping',
    category: 'Security',
  },
];

const categories = ['All', 'Technology', 'Security', 'Company News', 'Finance', 'Partnership'];
const featuredArticle = articles.find(a => a.featured) || articles[0];
const otherArticles = articles.filter(a => a !== featuredArticle);

export default function BlogArchivePage() {
    const [activeCategory, setActiveCategory] = useState('All');

    const filteredArticles = activeCategory === 'All'
        ? otherArticles
        : otherArticles.filter(a => a.category === activeCategory);
    
    return (
        <div className="flex flex-col min-h-screen">
            <SiteHeader />
            <main className="flex-1">
                {/* Page Header */}
                <section className="w-full py-12 md:py-20 lg:py-24 bg-muted">
                    <div className="container px-4 md:px-6 text-center">
                        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">From the Blog</h1>
                        <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl mt-4">
                            News, updates, and insights from the Payvost team.
                        </p>
                    </div>
                </section>

                {/* All Articles */}
                <section className="w-full py-12 md:py-20 lg:py-24">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">All Articles</h2>
                            <div className="flex flex-wrap justify-center gap-2">
                                {categories.map(cat => (
                                    <Button
                                        key={cat}
                                        variant={activeCategory === cat ? 'default' : 'outline'}
                                        onClick={() => setActiveCategory(cat)}
                                    >
                                        {cat}
                                    </Button>
                                ))}
                            </div>
                        </div>

                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredArticles.map(article => (
                                <Link key={article.slug} href={`/blog/${article.slug}`} className="group">
                                    <Card className="flex flex-col h-full overflow-hidden transition-shadow group-hover:shadow-xl">
                                        <div className="relative aspect-video">
                                            <Image
                                                src={article.featuredImage}
                                                alt={article.title}
                                                fill
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                className="object-cover"
                                                data-ai-hint={article.imageHint || 'abstract technology'}
                                            />
                                        </div>
                                        <CardHeader>
                                            <Badge variant="secondary" className="w-fit mb-2">{article.category}</Badge>
                                            <CardTitle className="text-xl group-hover:text-primary transition-colors">{article.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex-grow">
                                            <p className="text-sm text-muted-foreground">{article.excerpt}</p>
                                        </CardContent>
                                        <CardFooter>
                                            <span className="text-sm font-semibold group-hover:text-primary transition-colors">Read More</span>
                                        </CardFooter>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

            </main>
            <SiteFooter />
        </div>
    )
}