
'use client';

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { ArrowRight, Download, Mail, Rss, Newspaper, Image as ImageIcon } from 'lucide-react';
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Twitter, Facebook, Linkedin } from "lucide-react";

const pressReleases = [
    {
        date: 'August 16, 2024',
        title: 'Payvost Partners with Google’s Anti-Money Laundering AI for Enhanced Security',
        excerpt: 'In a landmark move for the fintech industry, Payvost today announced a strategic partnership to integrate Google\'s advanced AML AI, setting a new standard for transaction security and fraud prevention.',
        href: '/blog/payvost-partners-with-google',
    },
    {
        date: 'July 22, 2024',
        title: 'Payvost Expands Services to Three New African Markets',
        excerpt: 'Payvost continues its global expansion, launching its secure remittance platform in Kenya, South Africa, and Egypt, making cross-border payments more accessible for millions.',
        href: '#',
    },
    {
        date: 'June 05, 2024',
        title: 'Payvost Secures $50M in Series B Funding to Fuel Global Growth',
        excerpt: 'Led by Global Fintech Ventures, the latest funding round will accelerate Payvost\'s product development and expansion into new corridors in Asia and Latin America.',
        href: '#',
    }
];

const featuredInLogos = [
    { name: 'TechCrunch', logo: 'https://placehold.co/150x40.png', hint: 'techcrunch logo' },
    { name: 'Forbes', logo: 'https://placehold.co/150x40.png', hint: 'forbes logo' },
    { name: 'Bloomberg', logo: 'https://placehold.co/150x40.png', hint: 'bloomberg logo' },
    { name: 'The Verge', logo: 'https://placehold.co/150x40.png', hint: 'the verge logo' },
    { name: 'Wired', logo: 'https://placehold.co/150x40.png', hint: 'wired logo' },
];

export default function PressPage() {
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
                        <div className="max-w-4xl mx-auto space-y-8">
                            {pressReleases.map(release => (
                                <Link href={release.href} key={release.title}>
                                    <Card className="hover:bg-muted/50 transition-colors group">
                                        <CardHeader>
                                            <p className="text-sm text-muted-foreground">{release.date}</p>
                                            <CardTitle className="text-xl group-hover:text-primary transition-colors">{release.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-muted-foreground">{release.excerpt}</p>
                                        </CardContent>
                                        <CardFooter>
                                            <span className="text-sm font-semibold text-primary">Read Full Story <ArrowRight className="inline-block ml-1 h-4 w-4" /></span>
                                        </CardFooter>
                                    </Card>
                                </Link>
                            ))}
                        </div>
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

            <footer className="bg-muted text-muted-foreground py-12">
                <div className="container mx-auto px-4 md:px-6">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-full md:w-[30%] space-y-4">
                      <Link href="#" className="flex items-center space-x-2">
                        <Icons.logo className="h-8" />
                      </Link>
                      <p className="text-sm">Stay up to date with the latest news, announcements, and articles.</p>
                      <form className="flex w-full max-w-sm space-x-2">
                        <Input type="email" placeholder="Enter your email" />
                        <Button type="submit">Subscribe</Button>
                      </form>
                    </div>
                    <div className="w-full md:w-[70%] grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="space-y-4">
                        <h4 className="font-semibold text-foreground">Product</h4>
                        <ul className="space-y-2">
                            <li><Link href="/#features" className="hover:text-primary transition-colors">Features</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Pricing</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Integrations</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">API</Link></li>
                        </ul>
                        </div>
                        <div className="space-y-4">
                        <h4 className="font-semibold text-foreground">Company</h4>
                        <ul className="space-y-2">
                            <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                            <li><Link href="/careers" className="hover:text-primary transition-colors">Careers</Link></li>
                            <li><Link href="/press" className="hover:text-primary transition-colors">Press</Link></li>
                            <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
                        </ul>
                        </div>
                        <div className="space-y-4">
                        <h4 className="font-semibold text-foreground">Resources</h4>
                        <ul className="space-y-2">
                            <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                            <li><Link href="/support" className="hover:text-primary transition-colors">Help Center</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Developers</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Security</Link></li>
                        </ul>
                        </div>
                        <div className="space-y-4">
                        <h4 className="font-semibold text-foreground">Policies</h4>
                        <ul className="space-y-2">
                            <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
                        </ul>
                        </div>
                    </div>
                  </div>
                  <div className="mt-8 pt-8 border-t border-muted-foreground/20 flex flex-col sm:flex-row justify-between items-center">
                    <p className="text-sm">&copy; {new Date().getFullYear()} Payvost Inc. All rights reserved.</p>
                    <div className="flex space-x-4 mt-4 sm:mt-0">
                      <Link href="https://x.com/payvost" rel="nofollow" target="_blank" className="hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></Link>
                      <Link href="https://facebook.com/payvost" rel="nofollow" target="_blank" className="hover:text-primary transition-colors"><Facebook className="h-5 w-5" /></Link>
                      <Link href="#" className="hover:text-primary transition-colors"><Linkedin className="h-5 w-5" /></Link>
                    </div>
                  </div>
                </div>
            </footer>
        </div>
    )
}
