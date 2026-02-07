'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { paymentsService } from '@/services/paymentsService';

export interface SavedBillTemplate {
  id: string;
  providerEntityId: string; // billerId
  nickname?: string | null;
  lastUsedAt?: string | null;
  fields: {
    subscriberAccountNumber?: string;
    targetCurrency?: string;
    [key: string]: any;
  };
}

interface SavedBillTemplatesProps {
  onSelectTemplate: (template: SavedBillTemplate) => void;
}

export function SavedBillTemplates({ onSelectTemplate }: SavedBillTemplatesProps) {
  const [templates, setTemplates] = useState<SavedBillTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await paymentsService.templates('BILL_PAYMENT');
        if (!cancelled) setTemplates((res.items || []) as SavedBillTemplate[]);
      } catch (error) {
        console.error('Failed to load saved bill templates:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (templateId: string) => {
    try {
      await paymentsService.deleteTemplate(templateId);
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading saved bills...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saved Bills</CardTitle>
          <CardDescription>Quick pay for frequently paid bills</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No saved bills yet. Your frequently paid bills will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Bills</CardTitle>
        <CardDescription>Quick pay for frequently paid bills</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold mb-1">
                    {template.nickname || template.fields?.billerName || `Biller ${template.providerEntityId}`}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Account: {template.fields?.subscriberAccountNumber || 'N/A'}</div>
                    {template.lastUsedAt ? (
                      <div>Last used: {format(new Date(template.lastUsedAt), 'MMM dd, yyyy')}</div>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => onSelectTemplate(template)}>
                  Pay Now
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(template.id)} aria-label="Delete template">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
