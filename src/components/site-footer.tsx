'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FooterProps {
  variant?: 'default' | 'compact';
}

export function SiteFooter({ variant = 'default' }: FooterProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address to subscribe.",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Successfully subscribed! 🎉",
          description: "Thank you for subscribing to our newsletter. Check your inbox for a welcome email.",
        });
        setEmail('');
      } else {
        throw new Error(data.error || 'Subscription failed');
      }
    } catch (error: any) {
      console.error('Newsletter subscription error:', error);
      toast({
        title: "Subscription failed",
        description: error.message || "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const footerLinks = {
    product: [
      { href: "/#features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/integrations", label: "Integrations" },
      { href: "/api", label: "API" },
    ],
    company: [
      { href: "/about", label: "About Us" },
      { href: "/careers", label: "Careers" },
      { href: "/press", label: "Press" },
      { href: "/contact", label: "Contact" },
    ],
    resources: [
      { href: "/blog", label: "Blog" },
      { href: "/support", label: "Help Center" },
      { href: "/fx-rates", label: "Live FX Rates" },
      { href: "/developers", label: "Developers" },
      { href: "/security", label: "Security" },
    ],
    policies: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms & Conditions" },
    ],
  };

  const socialLinks = [
    { 
      href: "https://x.com/payvost", 
      icon: Icons.x, 
      label: "X (Twitter)",
      ariaLabel: "Follow us on X",
      color: "hover:text-[#000000] dark:hover:text-[#ffffff]"
    },
    { 
      href: "https://instagram.com/payvost", 
      icon: Icons.instagram, 
      label: "Instagram",
      ariaLabel: "Follow us on Instagram",
      color: "hover:text-[#E4405F]"
    },
    { 
      href: "https://facebook.com/payvost", 
      icon: Icons.facebook, 
      label: "Facebook",
      ariaLabel: "Follow us on Facebook",
      color: "hover:text-[#1877F2]"
    },
    { 
      href: "https://linkedin.com/company/payvost", 
      icon: Icons.linkedin, 
      label: "LinkedIn",
      ariaLabel: "Follow us on LinkedIn",
      color: "hover:text-[#0A66C2]"
    },
    { 
      href: "https://youtube.com/@payvost", 
      icon: Icons.youtube, 
      label: "YouTube",
      ariaLabel: "Subscribe to our YouTube channel",
      color: "hover:text-[#FF0000]"
    },
    { 
      href: "https://github.com/payvost", 
      icon: Icons.github, 
      label: "GitHub",
      ariaLabel: "Check out our GitHub",
      color: "hover:text-[#333333] dark:hover:text-[#ffffff]"
    },
  ];

  // Mobile Link Section Component
  const MobileLinkSection = ({ 
    title, 
    links, 
    sectionKey 
  }: { 
    title: string; 
    links: typeof footerLinks.product; 
    sectionKey: string;
  }) => (
    <div className="border-b border-border/50 last:border-0">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between py-4 text-left group"
        aria-expanded={expandedSections[sectionKey]}
        aria-controls={`footer-section-${sectionKey}`}
      >
        <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
          {title}
        </h4>
        <ChevronDown 
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            expandedSections[sectionKey] && "rotate-180"
          )} 
        />
      </button>
      <div
        id={`footer-section-${sectionKey}`}
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          expandedSections[sectionKey] ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <ul className="space-y-3 pb-4">
          {links.map((link) => (
            <li key={link.href}>
              <Link 
                href={link.href} 
                className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 block py-1"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  if (variant === 'compact') {
    return (
      <footer className="bg-gradient-to-b from-muted/50 to-muted border-t border-border/50">
        <div className="container mx-auto px-4 md:px-6 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              <Link href="/" className="flex items-center space-x-2 group">
                <Icons.logo className="h-6 w-6 transition-transform group-hover:scale-105" />
              </Link>
              <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                &copy; {new Date().getFullYear()} Payvost Inc. All rights reserved.
              </p>
            </div>
            <div className="flex items-center gap-4">
              {socialLinks.map(({ href, icon: Icon, ariaLabel, color }) => (
                <Link
                  key={ariaLabel}
                  href={href}
                  rel="nofollow noopener noreferrer"
                  target="_blank"
                  className={cn(
                    "hover:scale-110 transition-all duration-200 text-muted-foreground/70",
                    color
                  )}
                  aria-label={ariaLabel}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="relative bg-gradient-to-b from-background via-muted/30 to-muted/50 border-t border-border/50">
      {/* Decorative top border gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Main Footer Content */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 xl:gap-16 mb-12">
          {/* Brand & Newsletter Section - Full width on mobile, sidebar on desktop */}
          <div className="w-full lg:w-[35%] xl:w-[32%] space-y-6">
            {/* Logo & Brand */}
            <div className="space-y-4">
              <Link href="/" className="inline-flex items-center space-x-2 group">
                <Icons.logo className="h-8 w-8 sm:h-9 sm:w-9 transition-transform group-hover:scale-105 duration-200" />
              </Link>
              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground max-w-md">
                Empowering global financial freedom through secure, fast, and transparent cross-border payments.
              </p>
            </div>

            {/* Newsletter Subscription */}
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">
                  Stay Updated
                </h3>
                <p className="text-sm text-muted-foreground">
                  Get the latest news, updates, and exclusive offers delivered to your inbox.
                </p>
              </div>
              <form onSubmit={handleSubscribe} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2 max-w-md">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 h-11 bg-background border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    required
                    aria-label="Email address for newsletter"
                  />
                  <Button 
                    type="submit" 
                    className="h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all hover:shadow-lg hover:shadow-primary/20" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Subscribing...
                      </>
                    ) : (
                      "Subscribe"
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground/70">
                  We respect your privacy. Unsubscribe at any time.
                </p>
              </form>
            </div>

            {/* Social Links - Desktop only in this section, mobile shows at bottom */}
            <div className="hidden lg:block space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Follow Us</h3>
              <div className="flex items-center gap-3">
                {socialLinks.map(({ href, icon: Icon, ariaLabel, color }) => (
                  <Link
                    key={ariaLabel}
                    href={href}
                    rel="nofollow noopener noreferrer"
                    target="_blank"
                    className={cn(
                      "h-10 w-10 rounded-lg bg-background border border-border flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-md text-muted-foreground",
                      color
                    )}
                    aria-label={ariaLabel}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Links Grid - Mobile: Accordion, Tablet: 2 columns, Desktop: 4 columns */}
          <div className="w-full lg:w-[65%] xl:w-[68%]">
            {/* Desktop/Tablet Grid View */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 xl:gap-8">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  Product
                </h4>
                <ul className="space-y-3">
                  {footerLinks.product.map((link) => (
                    <li key={link.href}>
                      <Link 
                        href={link.href} 
                        className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 group flex items-center gap-1"
                      >
                        <span>{link.label}</span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  Company
                </h4>
                <ul className="space-y-3">
                  {footerLinks.company.map((link) => (
                    <li key={link.href}>
                      <Link 
                        href={link.href} 
                        className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 group flex items-center gap-1"
                      >
                        <span>{link.label}</span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  Resources
                </h4>
                <ul className="space-y-3">
                  {footerLinks.resources.map((link) => (
                    <li key={link.href}>
                      <Link 
                        href={link.href} 
                        className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 group flex items-center gap-1"
                      >
                        <span>{link.label}</span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  Legal
                </h4>
                <ul className="space-y-3">
                  {footerLinks.policies.map((link) => (
                    <li key={link.href}>
                      <Link 
                        href={link.href} 
                        className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 group flex items-center gap-1"
                      >
                        <span>{link.label}</span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Mobile Accordion View */}
            <div className="md:hidden space-y-0">
              <MobileLinkSection title="Product" links={footerLinks.product} sectionKey="product" />
              <MobileLinkSection title="Company" links={footerLinks.company} sectionKey="company" />
              <MobileLinkSection title="Resources" links={footerLinks.resources} sectionKey="resources" />
              <MobileLinkSection title="Legal" links={footerLinks.policies} sectionKey="policies" />
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 sm:pt-10 border-t border-border/50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            {/* Copyright */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
              <p className="text-xs sm:text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} Payvost Inc. All rights reserved.
              </p>
              <span className="hidden sm:inline text-muted-foreground/50">•</span>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  Privacy
                </Link>
                <span className="text-muted-foreground/50">•</span>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Terms
                </Link>
              </div>
            </div>

            {/* Social Links - Mobile & Tablet */}
            <div className="flex lg:hidden items-center gap-3">
              {socialLinks.map(({ href, icon: Icon, ariaLabel, color }) => (
                <Link
                  key={ariaLabel}
                  href={href}
                  rel="nofollow noopener noreferrer"
                  target="_blank"
                  className={cn(
                    "h-10 w-10 rounded-lg bg-background border border-border flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 text-muted-foreground",
                    color
                  )}
                  aria-label={ariaLabel}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              ))}
            </div>

            {/* Trust Badges (Optional - add your certifications here) */}
            <div className="hidden lg:flex items-center gap-4 text-xs text-muted-foreground">
              {/* Add trust badges/icons here if you have them */}
              <span className="px-3 py-1 rounded-md bg-background border border-border">
                🔒 Secured
              </span>
              <span className="px-3 py-1 rounded-md bg-background border border-border">
                ✓ Verified
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

