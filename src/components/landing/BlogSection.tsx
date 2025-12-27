
'use client';

import React from 'react';
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { TrendingUp, Calendar, Clock, ArrowRight } from "lucide-react";
import Image from "next/image";
import placeholderImageData from '@/app/lib/placeholder-images.json';

export function BlogSection() {
    const { blog: blogImages } = placeholderImageData;

    return (
        <section id="blog" className="w-full py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-b from-background to-muted/20">
            <div className="container mx-auto max-w-screen-2xl px-4 md:px-6">
                {/* Header Section */}
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12 sm:mb-16">
                    <Badge variant="outline" className="w-fit border-primary/40 bg-primary/10 text-primary uppercase tracking-[0.3em] sm:tracking-[0.4em] text-xs sm:text-sm px-3 py-1">
                        Insights & Updates
                    </Badge>
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                        From the Blog
                    </h2>
                    <p className="max-w-2xl text-muted-foreground text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed">
                        Stay updated with the latest news and insights from the world of finance, technology, and cross-border payments.
                    </p>
                </div>

                {/* Featured Post */}
                <div className="mb-8 sm:mb-12">
                    <Link href="/blog/payvost-partners-with-google" className="group block">
                        <Card className="overflow-hidden border-border/40 bg-background/90 transition-all duration-500 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
                            <div className="grid gap-0 lg:grid-cols-2">
                                <div className="relative aspect-video lg:aspect-auto lg:h-full min-h-[280px] overflow-hidden">
                                    <Image
                                        src={blogImages.payvost_google_partnership.src}
                                        fill
                                        sizes="(max-width: 1024px) 100vw, 50vw"
                                        data-ai-hint={blogImages.payvost_google_partnership.hint}
                                        alt="Payvost partners with Google"
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="absolute top-4 left-4">
                                        <Badge className="bg-primary text-primary-foreground border-primary/20 shadow-lg">
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                            Featured
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                                    <div className="flex items-center gap-3 mb-3 text-xs sm:text-sm text-muted-foreground flex-wrap">
                                        <Badge variant="secondary" className="text-xs">Partnerships</Badge>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3.5 w-3.5" />
                                            Jan 15, 2024
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" />
                                            5 min read
                                        </span>
                                    </div>
                                    <CardTitle className="text-2xl sm:text-3xl md:text-4xl mb-4 group-hover:text-primary transition-colors leading-tight">
                                        Payvost Partners with Google's Anti-Money Laundering AI for Risk and Fraud Management
                                    </CardTitle>
                                    <p className="text-muted-foreground text-sm sm:text-base mb-6 leading-relaxed line-clamp-3">
                                        Discover how Payvost is revolutionizing financial security by integrating Google's cutting-edge AI technology to enhance risk management and prevent fraud in cross-border transactions.
                                    </p>
                                    <div className="flex items-center gap-2 text-primary font-semibold text-sm sm:text-base group-hover:gap-3 transition-all">
                                        Read Full Article
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </Link>
                </div>

                {/* Blog Grid */}
                <div className="grid items-stretch gap-6 sm:gap-8 sm:grid-cols-2 lg:gap-8 mb-12">
                    <Link href="/blog/ai-remittance" className="group">
                        <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-lg border-border/40 bg-background/90">
                            <div className="relative aspect-video w-full overflow-hidden">
                                <Image
                                    src={blogImages.ai_remittance.src}
                                    fill
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 50vw"
                                    data-ai-hint={blogImages.ai_remittance.hint}
                                    alt="AI in Remittance"
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="absolute top-3 right-3">
                                    <Badge variant="secondary" className="text-xs backdrop-blur-sm bg-background/80">
                                        Technology
                                    </Badge>
                                </div>
                            </div>
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>Dec 20, 2023</span>
                                    <span className="mx-1">•</span>
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>4 min read</span>
                                </div>
                                <CardTitle className="text-xl sm:text-2xl group-hover:text-primary transition-colors leading-tight">
                                    The Future of Remittances: How AI is Changing the Game
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow pb-3">
                                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed line-clamp-2">
                                    Discover the revolutionary impact of artificial intelligence on cross-border payments and how it's reshaping the remittance landscape.
                                </p>
                            </CardContent>
                            <CardFooter className="pt-3">
                                <div className="flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all">
                                    Read More
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardFooter>
                        </Card>
                    </Link>
                </div>
            </div>
        </section>
    );
}
