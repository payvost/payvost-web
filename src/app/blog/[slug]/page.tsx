
'use client';

import { SiteHeader } from '@/components/site-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import Image from 'next/image';
import Link from 'next/link';
import { 
    Twitter, 
    Linkedin, 
    Facebook, 
    Bookmark,
    Share2,
    Link as LinkIcon,
    ArrowRight,
    ArrowLeft,
    Eye
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';

// Mock data for a single article. In a real app, you would fetch this based on the slug.
const article = {
  slug: 'payvost-partners-with-google',
  title: 'Payvost Partners with Google’s Anti-Money Laundering AI for Risk and Fraud Management',
  excerpt: 'A brief summary of the blog post goes here. Catch the reader\'s interest and give them a reason to click and read more about this exciting topic.',
  featuredImage: '/Payvost Building.png',
  author: {
    name: 'Pamilerin Coker',
    role: 'Head of Product',
    avatar: 'https://picsum.photos/seed/a1/100/100',
    avatarHint: 'woman portrait',
  },
  publishedAt: 'August 16, 2024',
  readingTime: '5 min read',
  tags: ['Partnership', 'AI', 'Security', 'Fintech'],
  content: `
    <p>We are thrilled to announce a strategic partnership with Google, integrating their state-of-the-art Anti-Money Laundering (AML) AI into the core of Payvost’s transaction monitoring system. This collaboration marks a significant milestone in our commitment to providing the most secure and reliable remittance platform on the market.</p>
    <h3 class="font-bold text-xl my-4">Leveraging Advanced AI to Combat Financial Crime</h3>
    <p>Financial crime is an ever-evolving threat, and staying ahead requires cutting-edge technology. Google's AML AI brings unparalleled analytical power to our platform, capable of processing millions of transactions in real-time to detect suspicious patterns that would be invisible to traditional rule-based systems.</p>
    <ul>
        <li><strong>Real-Time Analysis:</strong> Instantly flag potentially fraudulent activities as they happen.</li>
        <li><strong>Network-Level Insights:</strong> Uncover complex fraud rings and hidden relationships between accounts.</li>
        <li><strong>Reduced False Positives:</strong> The AI's learning capabilities significantly reduce the number of legitimate transactions being flagged, ensuring a smoother experience for our users.</li>
    </ul>
    <p>By integrating this technology, we are not just enhancing our security measures; we are building a smarter, more resilient financial ecosystem. Our users can send money with even greater confidence, knowing that their transactions are protected by one of the most advanced AI systems in the world.</p>
    <blockquote class="my-6 p-4 bg-muted/50 border-l-4 border-primary">
        "This partnership with Google allows us to proactively protect our users from financial crime at a scale and speed that was previously unimaginable. It's a game-changer for the remittance industry."
        <cite class="block mt-2 text-sm font-semibold not-italic">- Pamilerin Coker, Head of Product at Payvost</cite>
    </blockquote>
    <h3 class="font-bold text-xl my-4">What This Means for You</h3>
    <p>For our users, this means enhanced security without sacrificing convenience. The AI works silently in the background, making your international money transfers faster and safer. This move is part of our ongoing mission to build trust and transparency in the global financial landscape.</p>
  `
};

// In a real Next.js app, you'd use generateMetadata for SEO
// export async function generateMetadata({ params }: { params: { slug: string } }) { ... }

export default function ArticlePage({ params }: { params: { slug: string } }) {
  // In a real app, you would fetch article data using params.slug
  const { title, featuredImage, author, publishedAt, readingTime, tags, content } = article;

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
  );
}
