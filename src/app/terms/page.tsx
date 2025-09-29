
'use client';

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Twitter, Facebook, Linkedin } from "lucide-react";

const sections = [
  { id: 'introduction', title: '1. Introduction' },
  { id: 'accounts', title: '2. Accounts' },
  { id: 'intellectual-property', title: '3. Intellectual Property' },
  { id: 'restrictions', title: '4. Restrictions' },
  { id: 'limitation-of-liability', title: '5. Limitation of Liability' },
  { id: 'governing-law', title: '6. Governing Law' },
];

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6 text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">Terms & Conditions</h1>
            <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl mt-4">
              Please read these terms and conditions carefully before using Our Service.
            </p>
            <p className="text-xs text-muted-foreground mt-2">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </section>

        <div className="container mx-auto px-4 md:px-6 py-12 md:py-16 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-1">
                <div className="sticky top-24 space-y-4">
                <h2 className="text-xl font-bold">Table of Contents</h2>
                <ul className="space-y-2">
                    {sections.map(section => (
                    <li key={section.id}>
                        <Link href={`#${section.id}`} className="text-muted-foreground hover:text-primary transition-colors">
                        {section.title}
                        </Link>
                    </li>
                    ))}
                </ul>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:col-span-3">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                
                <section id="introduction">
                    <h2 className="text-3xl font-bold">1. Introduction</h2>
                    <p>Welcome to Payvost! These terms and conditions outline the rules and regulations for the use of Payvost's Website, located at payvost.com.</p>
                    <p>By accessing this website we assume you accept these terms and conditions. Do not continue to use Payvost if you do not agree to take all of the terms and conditions stated on this page.</p>
                </section>

                <section id="accounts">
                    <h2 className="text-3xl font-bold">2. Accounts</h2>
                    <p>When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
                    <p>You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service.</p>
                </section>
                
                <section id="intellectual-property">
                    <h2 className="text-3xl font-bold">3. Intellectual Property Rights</h2>
                    <p>Other than the content you own, under these Terms, Payvost and/or its licensors own all the intellectual property rights and materials contained in this Website.</p>
                    <p>You are granted a limited license only for purposes of viewing the material contained on this Website.</p>
                </section>

                <section id="restrictions">
                    <h2 className="text-3xl font-bold">4. Restrictions</h2>
                    <p>You are specifically restricted from all of the following:</p>
                    <ul>
                    <li>publishing any Website material in any other media;</li>
                    <li>selling, sublicensing and/or otherwise commercializing any Website material;</li>
                    <li>publicly performing and/or showing any Website material;</li>
                    <li>using this Website in any way that is or may be damaging to this Website;</li>
                    <li>using this Website contrary to applicable laws and regulations, or in any way may cause harm to the Website, or to any person or business entity;</li>
                    </ul>
                </section>

                <section id="limitation-of-liability">
                    <h2 className="text-3xl font-bold">5. Limitation of liability</h2>
                    <p>In no event shall Payvost, nor any of its officers, directors and employees, shall be held liable for anything arising out of or in any way connected with your use of this Website whether such liability is under contract. Payvost, including its officers, directors and employees shall not be held liable for any indirect, consequential or special liability arising out of or in any way related to your use of this Website.</p>
                </section>

                <section id="governing-law">
                    <h2 className="text-3xl font-bold">6. Governing Law & Jurisdiction</h2>
                    <p>These Terms will be governed by and interpreted in accordance with the laws of the State of Delaware, and you submit to the non-exclusive jurisdiction of the state and federal courts located in Delaware for the resolution of any disputes.</p>
                </section>
                </div>
            </main>
            </div>
        </div>
      </main>

       <footer className="bg-muted text-muted-foreground py-12">
            <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-[30%] space-y-4">
                <Link href="/" className="flex items-center space-x-2">
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
                        <li><Link href="#" className="hover:text-primary transition-colors">Press</Link></li>
                        <li><Link href="#" className="hover:text-primary transition-colors">Contact</Link></li>
                    </ul>
                    </div>
                    <div className="space-y-4">
                    <h4 className="font-semibold text-foreground">Resources</h4>
                    <ul className="space-y-2">
                        <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                        <li><Link href="#" className="hover:text-primary transition-colors">Help Center</Link></li>
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
                <Link href="#" className="hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></Link>
                <Link href="#" className="hover:text-primary transition-colors"><Facebook className="h-5 w-5" /></Link>
                <Link href="#" className="hover:text-primary transition-colors"><Linkedin className="h-5 w-5" /></Link>
                </div>
            </div>
            </div>
        </footer>
    </div>
  );
}
