# Invoice Service

Invoice management service migrated from Firestore to PostgreSQL for better scalability and cost efficiency.

## Features

- ✅ Unified invoice storage (USER and BUSINESS invoices)
- ✅ PostgreSQL-based with Prisma ORM
- ✅ RESTful API endpoints
- ✅ Access control and permissions
- ✅ Invoice statistics and reporting
- ✅ Support for multiple payment methods

## Database Schema

The Invoice model includes:
- Invoice metadata (number, type, status, dates)
- Billing information (from/to details)
- Line items and calculations
- Payment method configuration
- Public URL and PDF caching

## API Endpoints

### List Invoices
```
GET /api/invoices
GET /api/invoices?status=PENDING&limit=50&offset=0
```

### Get Invoice Statistics
```
GET /api/invoices/stats
```

### List Business Invoices
```
GET /api/invoices/business?businessId={id}
```

### Get Invoice
```
GET /api/invoices/:id
```

### Get Public Invoice (no auth)
```
GET /api/invoices/public/:id
```

### Create Invoice
```
POST /api/invoices
Content-Type: application/json

{
  "invoiceNumber": "INV-1234",
  "invoiceType": "USER",
  "issueDate": "2024-01-01T00:00:00Z",
  "dueDate": "2024-01-31T00:00:00Z",
  "currency": "USD",
  "fromInfo": { "name": "...", "address": "...", "email": "..." },
  "toInfo": { "name": "...", "address": "...", "email": "..." },
  "items": [{ "description": "...", "quantity": 1, "price": 100 }],
  "taxRate": 10,
  "paymentMethod": "PAYVOST",
  "status": "PENDING"
}
```

### Update Invoice
```
PATCH /api/invoices/:id
```

### Mark as Paid
```
POST /api/invoices/:id/mark-paid
```

### Delete Invoice
```
DELETE /api/invoices/:id
```

## Migration from Firestore

### Step 1: Apply Prisma Migration

```bash
cd backend/prisma
npx prisma migrate dev --name add_invoice_model
npx prisma generate
```

### Step 2: Run Migration Script

```bash
# Set environment variables
export FIREBASE_PROJECT_ID=your-project-id
export FIREBASE_PRIVATE_KEY=your-private-key
export FIREBASE_CLIENT_EMAIL=your-client-email
export DATABASE_URL=your-database-url

# Run migration
npx ts-node backend/services/invoice/migrate-firestore-to-postgres.ts
```

The migration script will:
1. Read all invoices from `invoices` collection
2. Read all invoices from `businessInvoices` collection
3. Convert and migrate to PostgreSQL
4. Preserve invoice IDs for reference integrity
5. Report success/error counts

### Step 3: Verify Migration

```sql
-- Check invoice counts
SELECT invoice_type, status, COUNT(*) 
FROM "Invoice" 
GROUP BY invoice_type, status;

-- Check a specific invoice
SELECT * FROM "Invoice" WHERE invoice_number = 'INV-XXXX';
```

## Service Usage

```typescript
import { PrismaClient } from '@prisma/client';
import { InvoiceService } from './src/invoice-service';

const prisma = new PrismaClient();
const invoiceService = new InvoiceService(prisma);

// Create invoice
const invoice = await invoiceService.createInvoice({
  invoiceNumber: 'INV-1234',
  invoiceType: 'USER',
  userId: 'user-id',
  createdBy: 'user-id',
  issueDate: new Date(),
  dueDate: new Date(),
  currency: 'USD',
  fromInfo: { name: '...', address: '...' },
  toInfo: { name: '...', address: '...', email: '...' },
  items: [{ description: '...', quantity: 1, price: 100 }],
  paymentMethod: 'PAYVOST',
});

// Get invoice
const invoice = await invoiceService.getInvoiceById('invoice-id', 'user-id');

// List invoices
const { invoices, total } = await invoiceService.listUserInvoices('user-id', {
  status: 'PENDING',
  limit: 50,
});
```

## Cost Benefits

- **Firestore**: ~$0.06 per 100k reads, $0.18 per 100k writes
- **PostgreSQL**: Fixed cost (Neon free tier: $0, Supabase free tier: $0)
- **Estimated savings**: 70-80% at scale

## Next Steps

1. ✅ Database migration complete
2. ⏳ Update frontend to use new API
3. ⏳ Add PDF caching
4. ⏳ Background job for PDF generation
5. ⏳ CDN integration

