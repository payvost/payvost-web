'use client';

import Link from 'next/link';
import { FileText, LifeBuoy, MessageCircleQuestion, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LegalSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Legal</h2>
        <p className="text-sm text-muted-foreground">Policies, privacy, and support links.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Support & Legal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button asChild variant="ghost" className="w-full justify-start">
            <Link href="/terms-and-conditions">
              <FileText className="mr-2 h-4 w-4" /> Terms & Conditions
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full justify-start">
            <Link href="/privacy-policy">
              <ShieldCheck className="mr-2 h-4 w-4" /> Privacy Policy
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full justify-start">
            <Link href="/dashboard/contact">
              <MessageCircleQuestion className="mr-2 h-4 w-4" /> FAQs
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full justify-start">
            <Link href="/dashboard/support">
              <LifeBuoy className="mr-2 h-4 w-4" /> Contact Support
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

