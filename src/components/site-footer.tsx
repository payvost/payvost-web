'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface FooterProps {
  variant?: 'default' | 'compact';
}

export function SiteFooter({ variant = 'default' }: FooterProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      ariaLabel: "Follow us on X"
    },
    { 
      href: "https://instagram.com/payvost", 
      icon: Icons.instagram, 
      label: "Instagram",
      ariaLabel: "Follow us on Instagram"
    },
    { 
      href: "https://facebook.com/payvost", 
      icon: Icons.facebook, 
      label: "Facebook",
      ariaLabel: "Follow us on Facebook"
    },
    { 
      href: "https://linkedin.com/company/payvost", 
      icon: Icons.linkedin, 
      label: "LinkedIn",
      ariaLabel: "Follow us on LinkedIn"
    },
    { 
      href: "https://youtube.com/@payvost", 
      icon: Icons.youtube, 
      label: "YouTube",
      ariaLabel: "Subscribe to our YouTube channel"
    },
    { 
      href: "https://github.com/payvost", 
      icon: Icons.github, 
      label: "GitHub",
      ariaLabel: "Check out our GitHub"
    },
  ];

  if (variant === 'compact') {
    return (
      <footer className="bg-muted text-muted-foreground py-8 border-t">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Icons.logo className="h-6 w-6" />
              <p className="text-sm">&copy; {new Date().getFullYear()} Payvost Inc. All rights reserved.</p>
            </div>
            <div className="flex items-center gap-3">
              {socialLinks.map(({ href, icon: Icon, ariaLabel }) => (
                <Link
                  key={ariaLabel}
                  href={href}
                  rel="nofollow noopener noreferrer"
                  target="_blank"
                  className="hover:text-primary transition-colors duration-200 hover:scale-110"
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
    <footer className="bg-muted text-muted-foreground border-t">
      <div className="container mx-auto px-4 md:px-6 py-10 sm:py-12">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Brand & Newsletter Section */}
          <div className="w-full md:w-[30%] lg:w-[28%] space-y-5">
            <Link href="/" className="flex items-center space-x-2 group">
              <Icons.logo className="h-7 sm:h-8 transition-transform group-hover:scale-105" />
            </Link>
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground/90">
              Stay up to date with the latest news, announcements, and articles from Payvost.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex w-full max-w-sm gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="text-sm h-10 bg-background border-muted-foreground/20 focus:border-primary transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                <Button 
                  type="submit" 
                  className="h-10 text-sm px-4 bg-primary hover:bg-primary/90 transition-colors" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
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

          {/* Links Grid */}
          <div className="w-full md:w-[70%] lg:w-[72%] grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="space-y-3 sm:space-y-4">
              <h4 className="text-sm sm:text-base font-semibold text-foreground">Product</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                {footerLinks.product.map((link) => (
                  <li key={link.href}>
                    <Link 
                      href={link.href} 
                      className="hover:text-primary transition-colors duration-200 text-muted-foreground/80 hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <h4 className="text-sm sm:text-base font-semibold text-foreground">Company</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                {footerLinks.company.map((link) => (
                  <li key={link.href}>
                    <Link 
                      href={link.href} 
                      className="hover:text-primary transition-colors duration-200 text-muted-foreground/80 hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <h4 className="text-sm sm:text-base font-semibold text-foreground">Resources</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                {footerLinks.resources.map((link) => (
                  <li key={link.href}>
                    <Link 
                      href={link.href} 
                      className="hover:text-primary transition-colors duration-200 text-muted-foreground/80 hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <h4 className="text-sm sm:text-base font-semibold text-foreground">Policies</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                {footerLinks.policies.map((link) => (
                  <li key={link.href}>
                    <Link 
                      href={link.href} 
                      className="hover:text-primary transition-colors duration-200 text-muted-foreground/80 hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 sm:pt-8 border-t border-muted-foreground/20">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-xs sm:text-sm text-center sm:text-left text-muted-foreground/80">
              <p>&copy; {new Date().getFullYear()} Payvost Inc. All rights reserved.</p>
            </div>
            <div className="flex items-center gap-4">
              {socialLinks.map(({ href, icon: Icon, ariaLabel }) => (
                <Link
                  key={ariaLabel}
                  href={href}
                  rel="nofollow noopener noreferrer"
                  target={href !== "#" ? "_blank" : undefined}
                  className="hover:text-primary transition-all duration-200 hover:scale-110 text-muted-foreground/70"
                  aria-label={ariaLabel}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

