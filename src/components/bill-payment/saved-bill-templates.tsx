'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, deleteDoc, query, where } from 'firebase/firestore';
import { Loader2, Star, Trash2, Zap } from 'lucide-react';
import { format } from 'date-fns';

interface SavedBillTemplate {
  id: string;
  billerId: string;
  billerName: string;
  accountNumber: string;
  nickname?: string;
  lastPaidAmount: number;
  lastPaidDate: Date;
  currency: string;
  category?: string;
}

interface SavedBillTemplatesProps {
  onSelectTemplate: (template: SavedBillTemplate) => void;
}

export function SavedBillTemplates({ onSelectTemplate }: SavedBillTemplatesProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<SavedBillTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTemplates = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Load from recent bill payments
        const recentBillsRef = collection(db, 'users', user.uid, 'billTemplates');
        const snapshot = await getDocs(recentBillsRef);
        
        const loadedTemplates = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as SavedBillTemplate[];

        setTemplates(loadedTemplates);
      } catch (error) {
        console.error('Failed to load saved templates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [user]);

  const handleDelete = async (templateId: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'billTemplates', templateId));
      setTemplates(templates.filter(t => t.id !== templateId));
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
                    {template.nickname || template.billerName}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Account: {template.accountNumber}</div>
                    {template.lastPaidDate && (
                      <div>
                        Last paid: {format(new Date(template.lastPaidDate), 'MMM dd, yyyy')} • 
                        {template.lastPaidAmount.toFixed(2)} {template.currency}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => onSelectTemplate(template)}
                >
                  Pay Now
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(template.id)}
                >
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

