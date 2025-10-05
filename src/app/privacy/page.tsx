
'use client';

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Twitter, Facebook, Linkedin } from "lucide-react";

const sections = [
  { id: 'introduction', title: '1. Introduction' },
  { id: 'information-we-collect', title: '2. Information We Collect' },
  { id: 'how-we-use-information', title: '3. How We Use Your Information' },
  { id: 'data-sharing', title: '4. Data Sharing and Disclosure' },
  { id: 'data-security', title: '5. Data Security' },
  { id: 'your-rights', title: '6. Your Rights' },
  { id: 'contact-us', title: '7. Contact Us' },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />

        <main className="flex-1">
            {/* Hero Section */}
            <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
                <div className="container px-4 md:px-6 text-center">
                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">Privacy Policy</h1>
                    <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl mt-4">
                        Your privacy is important to us. This policy explains what information we collect and how we use it.
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
                        <p>Payvost ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by Payvost.</p>
                    </section>

                    <section id="information-we-collect">
                        <h2 className="text-3xl font-bold">2. Information We Collect</h2>
                        <p>We may collect personal information from you, such as your name, email address, postal address, phone number, and payment information when you use our services, create an account, or communicate with us.</p>
                    </section>
                    
                    <section id="how-we-use-information">
                        <h2 className="text-3xl font-bold">3. How We Use Your Information</h2>
                        <p>We use the information we collect to provide, maintain, and improve our services, including to process transactions, send you notifications, and respond to your comments and questions.</p>
                    </section>

                    <section id="data-sharing">
                        <h2 className="text-3xl font-bold">4. Data Sharing and Disclosure</h2>
                        <p>We do not share your personal information with third parties except as described in this Privacy Policy. We may share personal information with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.</p>
                    </section>

                    <section id="data-security">
                        <h2 className="text-3xl font-bold">5. Data Security</h2>
                        <p>We use reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration, and destruction.</p>
                    </section>

                    <section id="your-rights">
                        <h2 className="text-3xl font-bold">6. Your Rights</h2>
                        <p>You have the right to access, update, or delete the information we have on you. Whenever made possible, you can access, update or request deletion of your Personal Data directly within your account settings section.</p>
                    </section>

                    <section id="contact-us">
                        <h2 className="text-3xl font-bold">7. Contact Us</h2>
                        <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@payvost.com">privacy@payvost.com</a>.</p>
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
