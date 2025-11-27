import { siteUrl } from '@/lib/constants';

const siteUrlValue = siteUrl || 'https://payvost.com';

export function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    "name": "Payvost",
    "url": siteUrlValue,
    "logo": `${siteUrlValue}/clay-logo.png`,
    "description": "Fast, secure, and low-cost global money transfers. Send and receive money internationally across 70+ countries with competitive exchange rates.",
    "foundingDate": "2020",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "New York",
      "addressCountry": "US"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "email": "support@payvost.com",
      "availableLanguage": ["en", "es", "fr"]
    },
    "sameAs": [
      // Add social media links when available
      // "https://twitter.com/payvost",
      // "https://www.linkedin.com/company/payvost",
      // "https://www.facebook.com/payvost"
    ],
    "areaServed": {
      "@type": "Place",
      "name": "Worldwide"
    },
    "serviceType": [
      "Money Transfer",
      "International Remittance",
      "Foreign Exchange",
      "Payment Processing",
      "Multi-Currency Accounts"
    ]
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Payvost",
    "url": siteUrlValue,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteUrlValue}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}

