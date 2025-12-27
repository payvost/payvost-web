
import { FileCheck, Server, Clock, BarChart3, Code2, Layers } from "lucide-react";

export const popularCountries = [
    { name: 'Nigeria', currency: 'Naira (NGN)', flag: 'NG.png', hint: 'Lagos skyline' },
    { name: 'United States', currency: 'Dollar (USD)', flag: 'US.png', hint: 'New York city' },
    { name: 'United Kingdom', currency: 'Pounds (GBP)', flag: 'GB.png', hint: 'London city' },
    { name: 'Ghana', currency: 'Cedi (GHS)', flag: 'GH.png', hint: 'Accra landscape' },
    { name: 'Kenya', currency: 'Shilling (KES)', flag: 'KE.png', hint: 'Nairobi park' },
    { name: 'Canada', currency: 'Dollar (CAD)', flag: 'CA.png', hint: 'Toronto city' },
    { name: 'Australia', currency: 'Dollar (AUD)', flag: 'AU.png', hint: 'Sydney opera' },
    { name: 'Germany', currency: 'Euro (EUR)', flag: 'GE.png', hint: 'Berlin city' },
    { name: 'South Africa', currency: 'Rand (ZAR)', flag: 'SA.png', hint: 'Cape Town' },
];

export const testimonials = [
    {
        name: "Sarah Johnson",
        role: "CEO",
        company: "Innovate Inc.",
        initials: "SJ",
        rating: 5,
        quote: "Payvost is a game-changer. The speed and low fees are unmatched. Highly recommended for anyone sending money abroad.",
    },
    {
        name: "Michael Chen",
        role: "Freelancer",
        company: "Chen Designs",
        initials: "MC",
        rating: 5,
        quote: "As a freelancer working with international clients, Payvost has simplified my life. Getting paid is now fast and hassle-free.",
    },
    {
        name: "David Rodriguez",
        role: "CTO",
        company: "Tech Solutions",
        initials: "DR",
        rating: 4,
        quote: "The API is well-documented and easy to integrate. We were able to get up and running in just a couple of days. Solid platform.",
    },
    {
        name: "Emily White",
        role: "E-commerce Owner",
        company: "The Shop",
        initials: "EW",
        rating: 5,
        quote: "I love the multi-currency wallet feature. It makes managing payments from different countries so much easier.",
    },
];

export const heroPartnerLogos = [
    { name: "Google", src: "/Partners/Google_2015_logo.svg.png", priority: true },
    { name: "Visa", src: "/Partners/Visa_Inc._logo.svg.png" },
    { name: "Mastercard", src: "/Partners/Mastercard-logo.png" },
    { name: "Microsoft", src: "/Partners/Microsoft_logo_(2012).svg.png" },
];

export const workflowStages = [
    {
        step: "01",
        title: "Collect & verify",
        description: "Capture applications, run KYC/KYB, and issue digital wallets in minutes.",
        icon: FileCheck,
    },
    {
        step: "02",
        title: "Quote & commit",
        description: "Generate guaranteed FX quotes, set expiries, and lock liquidity atomically.",
        icon: Server,
    },
    {
        step: "03",
        title: "Disburse & track",
        description: "Execute payouts through Payvost’s global network with smart retries and instant notifications.",
        icon: Clock,
    },
    {
        step: "04",
        title: "Reconcile & report",
        description: "Stream ledger updates, automate reconciliations, and surface finance-ready reports.",
        icon: BarChart3,
    },
];

export const developerHighlights = [
    {
        title: "SDKs & client libraries",
        description: "TypeScript, Python, and mobile SDKs stay in lockstep with the API and include baked-in auth flows.",
        icon: Code2,
    },
    {
        title: "Webhook observability",
        description: "Replay payloads, inspect headers, and confirm deliveries from a dedicated developer console.",
        icon: Server,
    },
    {
        title: "Sandbox parity",
        description: "Test against the same FX engine, risk rules, and ledger primitives that run in production.",
        icon: Layers,
    },
    {
        title: "Comprehensive docs",
        description: "Get started quickly with step-by-step guides, API references, and code samples for every integration.",
        icon: FileCheck,
    },
];

export const faqs = [
    {
        value: "pricing",
        question: "How much does Payvost charge per transfer?",
        answer:
            "Fees vary by corridor and payment rail. We display fees and FX spreads per quote and offer volume discounts for enterprise partners.",
    },
    {
        value: "settlement",
        question: "How long does settlement take?",
        answer:
            "Instant for many wallet routes; local bank payouts usually settle in 1–3 business days. Every state change emits a webhook/event.",
    },
    {
        value: "kyc",
        question: "What KYC/KYB do you require?",
        answer:
            "Document + biometric checks for individuals; corporate docs, UBO, and sanction screening for businesses. Requirements vary by corridor.",
    },
    {
        value: "integration",
        question: "How can I integrate Payvost into my platform?",
        answer:
            "Use our TypeScript, Python, or mobile SDKs, or call the REST/GraphQL APIs directly. Sandbox mirrors production risk and ledger logic.",
    },
    {
        value: "limits",
        question: "What are the sending limits?",
        answer:
            "Default daily and monthly limits apply post-KYC. Higher programmatic limits can be requested based on volume, risk profile, and jurisdiction.",
    },
    {
        value: "currencies",
        question: "Which currencies do you support?",
        answer:
            "70+ payout currencies across bank, wallet, and cash pickup routes. A live matrix and corridor map is available in the dashboard.",
    },
    {
        value: "security",
        question: "How do you keep funds and data secure?",
        answer:
            "Encryption in transit/at rest, segregated client balances, real-time fraud heuristics, and continuous monitoring with audit trails.",
    },
    {
        value: "support",
        question: "Do you offer 24/7 support?",
        answer:
            "Yes. Live chat and critical incident escalation are available 24/7; dedicated success managers for qualified enterprise accounts.",
    },
];

export const developerCodeSample = `import { Payvost } from \'@payvost/sdk\';

const client = new Payvost({
  apiKey: process.env.PAYVOST_API_KEY!,
  environment: 'sandbox',
});

const quote = await client.fx.createQuote({
  sourceCurrency: 'USD',
  targetCurrency: 'NGN',
  amount: '5000',
  customerReference: 'INV-59210',
  expiresInSeconds: 120,
});

await client.payouts.create({
  quoteId: quote.id,
  beneficiaryId: 'bene_48f0a9',
  idempotencyKey: crypto.randomUUID(),
});

console.log('Transfer committed:', quote.lockedRate);`;
