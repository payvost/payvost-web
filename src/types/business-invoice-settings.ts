

export interface InvoiceSettings {
    defaultFooter?: string;
    enableTax: boolean;
    defaultTaxRate?: number;
    autoInvoiceForRecurring: boolean;
    invoiceTemplate?: 'default' | 'classic' | 'professional'; // Default: 'default'
}
