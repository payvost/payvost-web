
'use client';

import { useState } from 'react';
import { CreateQuoteForm } from '@/components/create-quote-form';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, PlusCircle } from "lucide-react";

export default function QuoteBuilderPage() {
  const [view, setView] = useState('list');
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);

  const handleCreateClick = () => {
    setEditingQuoteId(null);
    setView('create');
  };

  const handleBack = () => {
    setEditingQuoteId(null);
    setView('list');
  };

  const renderContent = () => {
    if (view === 'create') {
        return <CreateQuoteForm onBack={handleBack} quoteId={editingQuoteId} />;
    }
    
    // This is the default list view
    return (
        <>
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Quote Builder</h2>
                    <p className="text-muted-foreground">Create, send, and manage quotes for your clients.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button onClick={handleCreateClick}><PlusCircle className="mr-2 h-4 w-4"/>Create New Quote</Button>
                </div>
            </div>
            <Card className="h-96">
                <CardContent className="flex flex-col items-center justify-center h-full text-center">
                    <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-2xl font-bold tracking-tight">No Quotes Yet</h3>
                    <p className="text-sm text-muted-foreground mt-2">Get started by creating your first quote.</p>
                </CardContent>
            </Card>
        </>
    );
  };

  return <>{renderContent()}</>;
}
