'use client';

import { useEffect, useState } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { paymentsService } from '@/services/paymentsService';
import { useToast } from '@/hooks/use-toast';
import { Gift } from 'lucide-react';

type GiftCardProduct = {
  productId: number;
  productName: string;
  countryCode: string;
  logoUrls?: string[];
};

export default function PaymentsGiftCardsPage() {
  const { toast } = useToast();
  const [countryCode, setCountryCode] = useState<string>('US');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<GiftCardProduct[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await paymentsService.giftCardCatalog(countryCode);
        const items = Array.isArray(res.products) ? (res.products as GiftCardProduct[]) : [];
        if (!cancelled) setProducts(items.slice(0, 24));
      } catch (error: any) {
        console.error('Failed to load gift cards:', error);
        toast({
          title: 'Failed to load gift cards',
          description: error?.message || 'Please try again later',
          variant: 'destructive',
        });
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [countryCode, toast]);

  return (
    <DashboardLayout>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:p-5 lg:gap-6 lg:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold sm:text-lg md:text-2xl">Gift Cards</h1>
            <p className="text-sm text-muted-foreground">Catalog is provider-driven. Purchase flow is next.</p>
          </div>
          <div className="w-[220px]">
            <Select value={countryCode} onValueChange={setCountryCode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">United States (US)</SelectItem>
                <SelectItem value="NG">Nigeria (NG)</SelectItem>
                <SelectItem value="GB">United Kingdom (GB)</SelectItem>
                <SelectItem value="CA">Canada (CA)</SelectItem>
                <SelectItem value="GH">Ghana (GH)</SelectItem>
                <SelectItem value="KE">Kenya (KE)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Catalog</CardTitle>
            <CardDescription>Showing top products for {countryCode}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading gift cards...</div>
            ) : products.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {products.map((p) => (
                  <div
                    key={p.productId}
                    className="flex flex-col items-center justify-center p-4 sm:p-5 border rounded-lg hover:border-primary transition-colors"
                  >
                    {p.logoUrls && p.logoUrls.length ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.logoUrls[0]} alt={p.productName} className="h-14 w-auto object-contain rounded-md" />
                    ) : (
                      <div className="h-14 w-20 bg-muted rounded-md flex items-center justify-center">
                        <Gift className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <p className="mt-2 text-sm font-semibold text-center">{p.productName}</p>
                    <p className="text-xs text-muted-foreground">{p.countryCode}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">No gift cards available right now.</div>
            )}
          </CardContent>
        </Card>
      </main>
    </DashboardLayout >
  );
}

