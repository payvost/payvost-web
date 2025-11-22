'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { SiteFooter } from '@/components/site-footer';
import { contentService, Content } from '@/services/contentService';
import { format } from 'date-fns';

export default function BlogArchivePage() {
    const [articles, setArticles] = useState<Content[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [categories, setCategories] = useState<string[]>(['All']);

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                setLoading(true);
                const result = await contentService.list({
                    contentType: 'BLOG',
                    status: 'PUBLISHED',
                    limit: 50,
                });
                
                setArticles(result.items);
                
                // Extract unique categories
                const uniqueCategories = ['All', ...Array.from(new Set(
                    result.items
                        .map(item => item.category)
                        .filter((cat): cat is string => !!cat)
                ))];
                setCategories(uniqueCategories);
            } catch (error) {
                console.error('Failed to fetch articles:', error);
                // Fallback to empty array on error
                setArticles([]);
            } finally {
                setLoading(false);
            }
        };

        fetchArticles();
    }, []);

    const filteredArticles = activeCategory === 'All'
        ? articles
        : articles.filter(a => a.category === activeCategory);
    
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
                            {categories.length > 1 && (
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
                            )}
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredArticles.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">No articles found.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredArticles.map(article => (
                                    <Link key={article.id} href={`/blog/${article.slug}`} className="group">
                                        <Card className="flex flex-col h-full overflow-hidden transition-shadow group-hover:shadow-xl">
                                            <div className="relative aspect-video">
                                                <Image
                                                    src={article.featuredImage || '/optimized/Payvost Building.jpg'}
                                                    alt={article.title}
                                                    fill
                                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                    className="object-cover"
                                                />
                                            </div>
                                            <CardHeader>
                                                {article.category && (
                                                    <Badge variant="secondary" className="w-fit mb-2">{article.category}</Badge>
                                                )}
                                                <CardTitle className="text-xl group-hover:text-primary transition-colors">{article.title}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="flex-grow">
                                                <p className="text-sm text-muted-foreground">{article.excerpt || 'No excerpt available.'}</p>
                                            </CardContent>
                                            <CardFooter className="flex justify-between items-center text-xs text-muted-foreground">
                                                {article.publishedAt && (
                                                    <span>{format(new Date(article.publishedAt), 'MMM dd, yyyy')}</span>
                                                )}
                                                <span className="text-sm font-semibold group-hover:text-primary transition-colors">Read More</span>
                                            </CardFooter>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

            </main>
            <SiteFooter />
        </div>
    )
}
