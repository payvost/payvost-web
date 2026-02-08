'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Users } from 'lucide-react';

import { recipientService, type Recipient } from '@/services/recipientService';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

interface BeneficiariesProps {
  onSelectBeneficiary?: (beneficiaryId: string) => void;
}

/**
 * Legacy component name kept for compatibility.
 *
 * The old implementation stored beneficiaries in Firestore under `users/{uid}.beneficiaries`,
 * but production rules disallow those client-side writes. We now treat the Address Book
 * (`/dashboard/recipients`) as the source of truth (Prisma-backed via /api/recipient).
 */
export function Beneficiaries({ onSelectBeneficiary }: BeneficiariesProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user) {
        setLoading(false);
        setRecipients([]);
        return;
      }

      setLoading(true);
      try {
        const data = await recipientService.list();
        if (!cancelled) setRecipients(data);
      } catch {
        if (!cancelled) setRecipients([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recipients;
    return recipients.filter((r) => {
      return (
        r.name.toLowerCase().includes(q) ||
        (r.email || '').toLowerCase().includes(q) ||
        (r.bankName || '').toLowerCase().includes(q)
      );
    });
  }, [query, recipients]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Beneficiaries</CardTitle>
        <CardDescription>Saved bank beneficiaries from your Address Book.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            placeholder="Search beneficiaries..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border p-4 text-sm text-muted-foreground">
            No beneficiaries yet. Add one in your Address Book.
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelectBeneficiary?.(r.id)}
                className="w-full text-left rounded-lg border p-3 hover:bg-accent transition-colors"
              >
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-muted-foreground">
                  {(() => {
                    const last4 = r.accountLast4 || (r.accountNumber ? String(r.accountNumber).slice(-4) : '');
                    const masked = last4 ? ` - ****${last4}` : '';
                    return `${r.bankName || 'Bank beneficiary'}${masked}`;
                  })()}
                </div>
              </button>
            ))}
          </div>
        )}

        <Button asChild variant="outline" className="w-full justify-start gap-2">
          <Link href="/dashboard/recipients">
            <Users className="h-4 w-4" />
            Manage address book
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default Beneficiaries;
