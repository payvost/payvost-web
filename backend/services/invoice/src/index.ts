import app from './app';

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Invoice service running on port ${PORT}`);
});

// Keep the exports for library usage
export { InvoiceService } from './invoice-service';
export type { CreateInvoiceInput, UpdateInvoiceInput } from './invoice-service';

