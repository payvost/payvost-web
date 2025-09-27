
'use client';

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";

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
              <h1>Terms and Conditions</h1>
              <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              
              <section id="introduction">
                <h2>1. Introduction</h2>
                <p>Welcome to Payvost! These terms and conditions outline the rules and regulations for the use of Payvost's Website, located at payvost.com.</p>
                <p>By accessing this website we assume you accept these terms and conditions. Do not continue to use Payvost if you do not agree to take all of the terms and conditions stated on this page.</p>
              </section>

              <section id="accounts">
                <h2>2. Accounts</h2>
                <p>When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
                <p>You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service.</p>
              </section>
              
              <section id="intellectual-property">
                <h2>3. Intellectual Property Rights</h2>
                <p>Other than the content you own, under these Terms, Payvost and/or its licensors own all the intellectual property rights and materials contained in this Website.</p>
                <p>You are granted a limited license only for purposes of viewing the material contained on this Website.</p>
              </section>

              <section id="restrictions">
                <h2>4. Restrictions</h2>
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
                <h2>5. Limitation of liability</h2>
                <p>In no event shall Payvost, nor any of its officers, directors and employees, shall be held liable for anything arising out of or in any way connected with your use of this Website whether such liability is under contract. Payvost, including its officers, directors and employees shall not be held liable for any indirect, consequential or special liability arising out of or in any way related to your use of this Website.</p>
              </section>

              <section id="governing-law">
                <h2>6. Governing Law & Jurisdiction</h2>
                <p>These Terms will be governed by and interpreted in accordance with the laws of the State of Delaware, and you submit to the non-exclusive jurisdiction of the state and federal courts located in Delaware for the resolution of any disputes.</p>
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
