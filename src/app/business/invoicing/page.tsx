
'use client';

import * as React from 'react';
import { CreateInvoicePage } from '@/components/create-invoice-page';
import { InvoiceListView } from '@/components/invoice-list-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RecurringInvoiceView } from '@/components/recurring-invoice-view';
import { CreateRecurringInvoiceForm } from '@/components/create-recurring-invoice-form';

type View = 'list' | 'create';
type RecurringView = 'recurring_list' | 'recurring_create';

export default function BusinessInvoicingPage() {
    const [oneTimeView, setOneTimeView] = React.useState<View>('list');
    const [recurringView, setRecurringView] = React.useState<RecurringView>('recurring_list');
    
    const renderOneTimeContent = () => {
        switch (oneTimeView) {
            case 'create':
                return <CreateInvoicePage onBack={() => setOneTimeView('list')} />;
            case 'list':
            default:
                return <InvoiceListView onCreateClick={() => setOneTimeView('create')} />;
        }
    };

     const renderRecurringContent = () => {
        switch (recurringView) {
            case 'recurring_create':
                return <CreateRecurringInvoiceForm onBack={() => setRecurringView('recurring_list')} />;
            case 'recurring_list':
            default:
                return <RecurringInvoiceView onCreateClick={() => setRecurringView('recurring_create')} />;
        }
    };
    
    return (
        <div className="space-y-6">
            <Tabs defaultValue="one-time">
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="one-time">One-Time Invoices</TabsTrigger>
                        <TabsTrigger value="recurring">Recurring Invoices</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="one-time" className="mt-4">
                    {renderOneTimeContent()}
                </TabsContent>
                <TabsContent value="recurring" className="mt-4">
                    {renderRecurringContent()}
                </TabsContent>
            </Tabs>
        </div>
    )
}
