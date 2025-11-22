'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, BookOpen, HelpCircle, ArrowRight, LifeBuoy, MessageSquarePlus } from 'lucide-react';
import { SiteFooter } from '@/components/site-footer';
import { contentService, Content } from '@/services/contentService';
import { format } from 'date-fns';

function HelpCenterContent() {
    const searchParams = useSearchParams();
    const [articles, setArticles] = useState<Content[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'All');

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                setLoading(true);
                const result = await contentService.list({
                    contentType: 'KNOWLEDGE_BASE',
                    status: 'PUBLISHED',
                    limit: 100,
                });
                setArticles(result.items);
            } catch (error) {
                console.error('Failed to fetch knowledge base articles:', error);
                setArticles([]);
            } finally {
                setLoading(false);
            }
        };

        fetchArticles();
    }, []);

    // Extract unique categories
    const categories = useMemo(() => {
        const uniqueCategories = Array.from(new Set(
            articles
                .map(item => item.category)
                .filter((cat): cat is string => !!cat)
        ));
        return ['All', ...uniqueCategories];
    }, [articles]);

    // Filter articles by search term and category
    const filteredArticles = useMemo(() => {
        return articles.filter(article => {
            const matchesSearch = searchTerm === '' || 
                article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                article.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
            
            return matchesSearch && matchesCategory;
        });
    }, [articles, searchTerm, selectedCategory]);

    // Group articles by category for better organization
    const articlesByCategory = useMemo(() => {
        const grouped: Record<string, Content[]> = {};
        filteredArticles.forEach(article => {
            const category = article.category || 'Other';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(article);
        });
        return grouped;
    }, [filteredArticles]);

    return (
        <div className="flex flex-col min-h-screen">
            <SiteHeader />
            <main className="flex-1">
                {/* Hero Section */}
                <section className="w-full bg-muted">
                    <div className="py-20 md:py-28 lg:py-32">
                        <div className="container px-4 md:px-6 text-center">
                            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                                Help Center
                            </h1>
                            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl mt-4">
                                Find answers to common questions and learn how to get the most out of Payvost.
                            </p>
                            <div className="mx-auto mt-6 max-w-2xl">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search for answers..."
                                        className="w-full rounded-full bg-background py-6 pl-12 pr-4 text-lg"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Categories Filter */}
                {categories.length > 1 && (
                    <section className="w-full py-6 border-b bg-background">
                        <div className="container px-4 md:px-6">
                            <div className="flex flex-wrap gap-2 justify-center">
                                {categories.map(category => (
                                    <Button
                                        key={category}
                                        variant={selectedCategory === category ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setSelectedCategory(category)}
                                    >
                                        {category}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Articles Section */}
                <section className="w-full py-12 md:py-20 lg:py-24">
                    <div className="container px-4 md:px-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredArticles.length === 0 ? (
                            <div className="text-center py-12">
                                <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <p className="text-muted-foreground">
                                    {searchTerm ? 'No articles found matching your search.' : 'No articles available yet.'}
                                </p>
                                {searchTerm && (
                                    <Button
                                        variant="outline"
                                        className="mt-4"
                                        onClick={() => setSearchTerm('')}
                                    >
                                        Clear Search
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="grid gap-12 lg:grid-cols-3">
                                {/* Articles List */}
                                <div className="lg:col-span-2 space-y-8">
                                    {selectedCategory === 'All' ? (
                                        // Show all articles grouped by category
                                        Object.entries(articlesByCategory).map(([category, categoryArticles]) => (
                                            <div key={category}>
                                                <h2 className="text-2xl font-bold mb-4">{category}</h2>
                                                <div className="space-y-3">
                                                    {categoryArticles.map(article => (
                                                        <Link
                                                            key={article.id}
                                                            href={`/help/${article.slug}`}
                                                            className="block"
                                                        >
                                                            <Card className="hover:bg-muted/50 transition-colors group">
                                                                <CardContent className="p-4">
                                                                    <div className="flex items-start justify-between gap-4">
                                                                        <div className="flex-1">
                                                                            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                                                                {article.title}
                                                                            </h3>
                                                                            {article.excerpt && (
                                                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                                                    {article.excerpt}
                                                                                </p>
                                                                            )}
                                                                            {article.tags.length > 0 && (
                                                                                <div className="flex flex-wrap gap-2 mt-2">
                                                                                    {article.tags.slice(0, 3).map(tag => (
                                                                                        <Badge key={tag} variant="outline" className="text-xs">
                                                                                            {tag}
                                                                                        </Badge>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        // Show articles for selected category
                                        <div>
                                            <h2 className="text-2xl font-bold mb-4">{selectedCategory}</h2>
                                            <div className="space-y-3">
                                                {filteredArticles.map(article => (
                                                    <Link
                                                        key={article.id}
                                                        href={`/help/${article.slug}`}
                                                        className="block"
                                                    >
                                                        <Card className="hover:bg-muted/50 transition-colors group">
                                                            <CardContent className="p-4">
                                                                <div className="flex items-start justify-between gap-4">
                                                                    <div className="flex-1">
                                                                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                                                            {article.title}
                                                                        </h3>
                                                                        {article.excerpt && (
                                                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                                                {article.excerpt}
                                                                            </p>
                                                                        )}
                                                                        {article.tags.length > 0 && (
                                                                            <div className="flex flex-wrap gap-2 mt-2">
                                                                                {article.tags.slice(0, 3).map(tag => (
                                                                                    <Badge key={tag} variant="outline" className="text-xs">
                                                                                        {tag}
                                                                                    </Badge>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Sidebar */}
                                <div className="lg:col-span-1">
                                    <Card className="bg-muted/50 sticky top-24">
                                        <CardHeader className="items-center text-center">
                                            <div className="p-3 bg-primary/10 rounded-full">
                                                <LifeBuoy className="h-8 w-8 text-primary" />
                                            </div>
                                            <CardTitle>Still need help?</CardTitle>
                                            <CardDescription>Our support team is here to help.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Button className="w-full" asChild>
                                                <Link href="/contact">
                                                    <MessageSquarePlus className="mr-2 h-4 w-4" /> Contact Support
                                                </Link>
                                            </Button>
                                        </CardContent>
                                        <CardFooter className="text-center text-xs text-muted-foreground">
                                            <p>Our team is available 24/7 to assist you with any questions or issues.</p>
                                        </CardFooter>
                                    </Card>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>
            <SiteFooter />
        </div>
    );
}

export default function HelpCenterPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col min-h-screen">
                <SiteHeader />
                <main className="flex-1">
                    <section className="w-full bg-muted">
                        <div className="py-20 md:py-28 lg:py-32">
                            <div className="container px-4 md:px-6 text-center">
                                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                                    Help Center
                                </h1>
                                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl mt-4">
                                    Find answers to common questions and learn how to get the most out of Payvost.
                                </p>
                                <div className="mx-auto mt-6 max-w-2xl">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            type="search"
                                            placeholder="Search for answers..."
                                            className="w-full rounded-full bg-background py-6 pl-12 pr-4 text-lg"
                                            disabled
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="w-full py-12 md:py-20 lg:py-24">
                        <div className="container px-4 md:px-6">
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        </div>
                    </section>
                </main>
                <SiteFooter />
            </div>
        }>
            <HelpCenterContent />
        </Suspense>
    );
}

