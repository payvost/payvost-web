'use client';

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

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
              <h1>Privacy Policy</h1>
              <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              
              <section id="introduction">
                <h2>1. Introduction</h2>
                <p>Payvost ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by Payvost.</p>
              </section>

              <section id="information-we-collect">
                <h2>2. Information We Collect</h2>
                <p>We may collect personal information from you, such as your name, email address, postal address, phone number, and payment information when you use our services, create an account, or communicate with us.</p>
              </section>
              
              <section id="how-we-use-information">
                <h2>3. How We Use Your Information</h2>
                <p>We use the information we collect to provide, maintain, and improve our services, including to process transactions, send you notifications, and respond to your comments and questions.</p>
              </section>

              <section id="data-sharing">
                <h2>4. Data Sharing and Disclosure</h2>
                <p>We do not share your personal information with third parties except as described in this Privacy Policy. We may share personal information with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.</p>
              </section>

              <section id="data-security">
                <h2>5. Data Security</h2>
                <p>We use reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration, and destruction.</p>
              </section>

               <section id="your-rights">
                <h2>6. Your Rights</h2>
                <p>You have the right to access, update, or delete the information we have on you. Whenever made possible, you can access, update or request deletion of your Personal Data directly within your account settings section.</p>
              </section>

               <section id="contact-us">
                <h2>7. Contact Us</h2>
                <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@payvost.com">privacy@payvost.com</a>.</p>
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
