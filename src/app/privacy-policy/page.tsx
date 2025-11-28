
'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Loader2 } from "lucide-react";

export default function PrivacyPolicyPage() {
  const [content, setContent] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tocItems, setTocItems] = useState<Array<{ id: string; text: string; level: number }>>([]);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const response = await fetch('/api/legal-docs?type=privacy');
      if (response.ok) {
        const data = await response.json();
        setContent(data.content || '');
        if (data.publishedAt) {
          setLastUpdated(new Date(data.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
        }
        
        // Generate TOC from content
        if (data.content) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = data.content;
          const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
          const toc: Array<{ id: string; text: string; level: number }> = [];
          headings.forEach((heading, index) => {
            const level = parseInt(heading.tagName.charAt(1));
            const text = heading.textContent || '';
            const id = heading.id || `heading-${index}`;
            toc.push({ id, text, level });
          });
          setTocItems(toc);
        }
      }
    } catch (error) {
      console.error('Error loading privacy policy:', error);
    } finally {
      setLoading(false);
    }
  };

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
            {lastUpdated && (
              <p className="text-xs text-muted-foreground mt-2">Last updated: {lastUpdated}</p>
            )}
          </div>
        </section>

        <div className="container mx-auto px-4 md:px-6 py-12 md:py-16 lg:py-20 max-w-7xl">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
              {/* Sidebar Navigation */}
              {tocItems.length > 0 && (
                <aside className="lg:col-span-1">
                  <div className="sticky top-24 space-y-4">
                    <h2 className="text-xl font-bold">Table of Contents</h2>
                    <ul className="space-y-2">
                      {tocItems.map((item, index) => (
                        <li key={index}>
                          <Link 
                            href={`#${item.id}`} 
                            className="text-muted-foreground hover:text-primary transition-colors"
                            style={{ marginLeft: `${(item.level - 1) * 0.5}rem` }}
                          >
                            {item.text}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </aside>
              )}

              {/* Main Content */}
              <main className={tocItems.length > 0 ? "lg:col-span-3" : "lg:col-span-4"}>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  {content ? (
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                  ) : (
                    <p className="text-muted-foreground">Privacy policy content is being updated. Please check back soon.</p>
                  )}
                </div>
              </main>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

