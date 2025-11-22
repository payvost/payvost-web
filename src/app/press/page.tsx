'use client';

import { useEffect, useState } from 'react';
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { ArrowRight, Download, Mail, Rss, Newspaper, Image as ImageIcon, Loader2 } from 'lucide-react';
import Image from "next/image";
import { SiteFooter } from "@/components/site-footer";
import { contentService, Content } from '@/services/contentService';
import { format } from 'date-fns';

const featuredInLogos = [
    { name: 'TechCrunch', logo: 'https://placehold.co/150x40.png', hint: 'techcrunch logo' },
    { name: 'Forbes', logo: 'https://placehold.co/150x40.png', hint: 'forbes logo' },
    { name: 'Bloomberg', logo: 'https://placehold.co/150x40.png', hint: 'bloomberg logo' },
    { name: 'The Verge', logo: 'https://placehold.co/150x40.png', hint: 'the verge logo' },
    { name: 'Wired', logo: 'https://placehold.co/150x40.png', hint: 'wired logo' },
];

export default function PressPage() {
    const [pressReleases, setPressReleases] = useState<Content[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPressReleases = async () => {
            try {
                setLoading(true);
                const result = await contentService.list({
                    contentType: 'PRESS_RELEASE',
                    status: 'PUBLISHED',
                    limit: 50,
                });
                setPressReleases(result.items);
            } catch (error) {
                console.error('Failed to fetch press releases:', error);
                setPressReleases([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPressReleases();
    }, []);

    return (
        <div className="flex flex-col min-h-screen">
            <SiteHeader />

            <main>
                {/* Hero Section */}
                <section className="w-full py-20 md:py-32 lg:py-40 bg-muted/50">
                    <div className="container mx-auto px-4 md:px-6 text-center">
                        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">Press & Media</h1>
                        <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl mt-4">
                            Welcome to the Payvost press center. Find our latest announcements, media assets, and contact information.
                        </p>
                    </div>
                </section>

                {/* Press Releases Section */}
                <section id="releases" className="w-full py-12 md:py-24 lg:py-32">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Recent Releases</h2>
                            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                The latest news and announcements from Payvost.
                            </p>
                        </div>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : pressReleases.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">No press releases available.</p>
                            </div>
                        ) : (
                            <div className="max-w-4xl mx-auto space-y-8">
                                {pressReleases.map(release => (
                                    <Link href={`/blog/${release.slug}`} key={release.id}>
                                        <Card className="hover:bg-muted/50 transition-colors group">
                                            <CardHeader>
                                                {release.publishedAt && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {format(new Date(release.publishedAt), 'MMMM dd, yyyy')}
                                                    </p>
                                                )}
                                                <CardTitle className="text-xl group-hover:text-primary transition-colors">{release.title}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-muted-foreground">{release.excerpt || 'No excerpt available.'}</p>
                                            </CardContent>
                                            <CardFooter>
                                                <span className="text-sm font-semibold text-primary">Read Full Story <ArrowRight className="inline-block ml-1 h-4 w-4" /></span>
                                            </CardFooter>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
                
                 {/* Featured In Section */}
                <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
                    <div className="container mx-auto px-4 md:px-6">
                        <h2 className="text-3xl font-bold tracking-tighter text-center mb-12 sm:text-4xl">As Featured In</h2>
                        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
                            {featuredInLogos.map(media => (
                                <img key={media.name} src={media.logo} data-ai-hint={media.hint} alt={media.name} className="h-8 md:h-10 object-contain" />
                            ))}
                        </div>
                    </div>
                </section>

                {/* Media Kit and Contact */}
                <section className="w-full py-12 md:py-24 lg:py-32">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Card className="flex flex-col justify-between">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Download className="h-6 w-6 text-primary"/>Media Kit</CardTitle>
                                    <CardDescription>Download our official brand assets, including logos, product screenshots, and executive headshots.</CardDescription>
                                </CardHeader>
                                <CardFooter>
                                    <Button className="w-full md:w-auto">Download Media Kit</Button>
                                </CardFooter>
                            </Card>
                            <Card className="flex flex-col justify-between">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Mail className="h-6 w-6 text-primary"/>Media Inquiries</CardTitle>
                                    <CardDescription>For press-related questions, interviews, or other media inquiries, please get in touch with our communications team.</CardDescription>
                                </CardHeader>
                                <CardFooter>
                                    <Button variant="outline" className="w-full md:w-auto" asChild>
                                        <a href="mailto:press@payvost.com">Contact Us</a>
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </section>

            </main>
            <SiteFooter />
        </div>
    )
}
