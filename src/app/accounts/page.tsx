import type { Metadata } from 'next';
import { AccountsPageClient } from './accounts-client';

export const metadata: Metadata = {
  title: 'Multi-Currency Accounts | Global Banking - Payvost',
  description: 'Open accounts in multiple currencies, manage your global finances, and send money worldwide. Personal and business accounts with multi-currency support, instant transfers, and bank-level security.',
  keywords: [
    'multi-currency account',
    'global bank account',
    'international account',
    'foreign currency account',
    'business account',
    'personal account',
    'multi-currency wallet',
    'global banking',
    'currency account',
    'international banking',
  ],
  openGraph: {
    title: 'Multi-Currency Accounts | Global Banking',
    description: 'Open accounts in multiple currencies and manage your global finances from one platform.',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Payvost Multi-Currency Accounts',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Multi-Currency Accounts | Global Banking',
    description: 'Open accounts in multiple currencies and manage your global finances.',
  },
  alternates: {
    canonical: '/accounts',
  },
};

export default function AccountsPage() {
  return <AccountsPageClient />;
}

export default function AccountsPage() {
  const { user, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || authLoading) {
    return <PublicPageSkeleton />;
  }

  const accountTypes = [
    {
      icon: <Wallet className="h-6 w-6" />,
      title: 'Personal Accounts',
      description: 'Multi-currency wallets for individuals. Hold, send, and receive money in 70+ currencies.',
      features: ['Multi-currency support', 'Instant transfers', 'Mobile app access', 'Free account creation'],
    },
    {
      icon: <Building2 className="h-6 w-6" />,
      title: 'Business Accounts',
      description: 'Advanced accounts for businesses with team management, invoicing, and analytics.',
      features: ['Team management', 'Invoice generation', 'Expense tracking', 'API access'],
    },
  ];

  const benefits = [
    {
      icon: <Globe className="h-6 w-6" />,
      title: 'Global Reach',
      description: 'Access to 70+ currencies and 150+ countries.',
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: 'Competitive Rates',
      description: 'Transparent FX rates with no hidden fees.',
    },
    {
      icon: <ShieldCheck className="h-6 w-6" />,
      title: 'Secure & Regulated',
      description: 'Bank-level security with full regulatory compliance.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto max-w-screen-2xl px-4 md:px-6 py-12 md:py-20">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Multi-Currency Accounts
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Open accounts in multiple currencies, manage your global finances, 
              and send money worldwide—all from one platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Button asChild size="lg">
                  <Link href="/dashboard/wallets">
                    View My Accounts
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg">
                    <Link href="/register">
                      Open Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/login">Sign In</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Account Types Section */}
        <section className="container mx-auto max-w-screen-2xl px-4 md:px-6 py-12 md:py-20">
          <h2 className="text-3xl font-bold text-center mb-12">Choose Your Account Type</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {accountTypes.map((account, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                    {account.icon}
                  </div>
                  <CardTitle>{account.title}</CardTitle>
                  <CardDescription>{account.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {account.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <ArrowRight className="h-4 w-4 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="container mx-auto max-w-screen-2xl px-4 md:px-6 py-12 md:py-20">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Payvost Accounts?</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {benefits.map((benefit, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                    {benefit.icon}
                  </div>
                  <CardTitle>{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto max-w-screen-2xl px-4 md:px-6 py-12 md:py-20">
          <Card className="bg-primary text-primary-foreground">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-4">Ready to Open an Account?</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Get started in minutes. No monthly fees, no minimum balance required.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              {user ? (
                <Button asChild size="lg" variant="secondary">
                  <Link href="/dashboard/wallets">
                    Manage Accounts
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" variant="secondary">
                  <Link href="/register">
                    Create Free Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

