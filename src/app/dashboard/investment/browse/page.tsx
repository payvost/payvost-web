'use client';

import { useState } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { InvestmentCard } from '@/components/investment/investment-card';
import type { InvestmentListing } from '@/types/investment';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Image from 'next/image';

const mockListings: InvestmentListing[] = [
    { id: 're1', title: 'Luxury Apartments in Lagos', category: 'Real Estate', roi: '8-12% APY', duration: '5 Years', riskLevel: 'Medium', image: '/investments/real-estate.jpg', description: 'Invest in high-yield luxury real estate in a prime location.', minInvestment: 5000 },
    { id: 'b1', title: 'U.S. Treasury Bonds', category: 'Bonds', roi: '4.5% APY', duration: '10 Years', riskLevel: 'Low', image: '/investments/bonds.jpg', description: 'A secure, long-term investment backed by the U.S. government.', minInvestment: 1000 },
    { id: 'c1', title: 'Diversified Crypto Portfolio', category: 'Crypto', roi: '15-25% APY', duration: '1-3 Years', riskLevel: 'High', image: '/investments/crypto.jpg', description: 'A managed portfolio of leading cryptocurrencies like Bitcoin and Ethereum.', minInvestment: 500 },
    { id: 'mf1', title: 'Global Tech Index Fund', category: 'Mutual Funds', roi: '10% APY (Avg)', duration: 'Varies', riskLevel: 'Medium', image: '/investments/mutual-funds.jpg', description: 'Invest in a diversified basket of top global technology stocks.', minInvestment: 100 },
    { id: 's1', title: 'Fintech Startup: Payvost', category: 'Startups', roi: 'High Growth Potential', duration: '5+ Years', riskLevel: 'High', image: '/investments/startups.jpg', description: 'Get in on the ground floor of the next big thing in finance.', minInvestment: 10000 },
    { id: 're2', title: 'Commercial REIT', category: 'Real Estate', roi: '7% Dividend Yield', duration: 'Ongoing', riskLevel: 'Medium', image: '/investments/real-estate-2.jpg', description: 'Invest in a portfolio of income-generating commercial properties.', minInvestment: 2500 },
    { id: 'b2', title: 'Corporate Bond Fund', category: 'Bonds', roi: '5.5% APY', duration: '3-5 Years', riskLevel: 'Low', image: '/investments/bonds-2.jpg', description: 'A diversified fund of investment-grade corporate bonds.', minInvestment: 1000 },
    { id: 'c2', title: 'DeFi Staking Pool', category: 'Crypto', roi: '8-15% APY', duration: 'Varies', riskLevel: 'High', image: '/investments/crypto-2.jpg', description: 'Earn rewards by staking stablecoins in decentralized finance protocols.', minInvestment: 200 },
];

const categories: InvestmentListing['category'][] = ['Real Estate', 'Bonds', 'Crypto', 'Mutual Funds', 'Startups'];

export default function InvestmentOpportunitiesPage() {
    const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredListings = mockListings.filter(listing => 
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout language={language} setLanguage={setLanguage}>
             <main className="flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold md:text-2xl">Investment Opportunities</h1>
                        <p className="text-muted-foreground text-sm">Explore curated investment options to grow your wealth.</p>
                    </div>
                </div>

                 <Tabs defaultValue="all" className="mt-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <TabsList>
                            <TabsTrigger value="all">All</TabsTrigger>
                            {categories.map(cat => (
                                <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>
                            ))}
                        </TabsList>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search investments..." 
                                className="pl-10" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <TabsContent value="all" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {filteredListings.map(listing => <InvestmentCard key={listing.id} listing={listing} />)}
                        </div>
                    </TabsContent>
                    {categories.map(cat => (
                        <TabsContent key={cat} value={cat} className="mt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {filteredListings.filter(l => l.category === cat).map(listing => <InvestmentCard key={listing.id} listing={listing} />)}
                            </div>
                        </TabsContent>
                    ))}
                 </Tabs>
            </main>
        </DashboardLayout>
    )
}
