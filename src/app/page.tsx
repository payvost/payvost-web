
'use client';

import React, { useRef } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { WorkflowSection } from "@/components/landing/WorkflowSection";
import { DeveloperSection } from "@/components/landing/DeveloperSection";
import { CountriesSection } from "@/components/landing/CountriesSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { BlogSection } from "@/components/landing/BlogSection";

export default function LandingPage() {
  const rateCardRef = useRef<HTMLDivElement | null>(null);

  const handleScrollToLiveRate = () => {
    if (rateCardRef.current) {
      rateCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection onScrollToRate={handleScrollToLiveRate} rateCardRef={rateCardRef} />
        <WorkflowSection />
        <DeveloperSection />
        <CountriesSection />
        <TestimonialsSection />
        <FAQSection />
        <BlogSection />
      </main>
      <SiteFooter />
    </div>
  );
}
