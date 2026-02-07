'use client';

import { useState } from 'react';
import type { GenerateNotificationInput } from '@/ai/flows/adaptive-notification-tool';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

export default function PaymentsBulkPage() {
  const [language, setLanguage] = useState<GenerateNotificationInput['languagePreference']>('en');

  return (
    <DashboardLayout language={language} setLanguage={setLanguage}>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:p-5 lg:gap-6 lg:p-6">
        <div className="flex items-center">
          <h1 className="text-base font-semibold sm:text-lg md:text-2xl">Bulk Payments</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Batch</CardTitle>
            <CardDescription>
              Bulk batch processing is wired at the data-model level (BulkBatch/BulkBatchItem). UI execution flow is next.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 sm:p-8 border-2 border-dashed border-muted-foreground/50 rounded-lg text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">Drag and drop your CSV here or click to upload.</p>
              <Button variant="outline" className="mt-4 w-full sm:w-auto" disabled>
                Upload File (Coming soon)
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Target: per-row validation, fee preview, batch submission, and per-item receipts.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full sm:w-auto" disabled>
              Process Batch (Coming soon)
            </Button>
          </CardFooter>
        </Card>
      </main>
    </DashboardLayout>
  );
}

