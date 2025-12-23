# Copilot Instructions for Payvost Web

## Project Architecture Overview

This is a full-stack fintech application built with Next.js frontend, Express.js microservices backend, and Firebase for auth/functions:

### Frontend (`/src`) - Next.js + TypeScript
- **App Router**: Pages in `/src/app/**`, API routes in `/src/app/api/**`
- **Components**: Reusable UI in `/src/components/`, hooks in `/src/hooks/`
- **Auth Pattern**: Firebase auth via `useAuth()` hook + API token passing
- **State**: Mix of client-side hooks + Firestore listeners for real-time data
- **Styling**: Tailwind CSS + Radix UI primitives (Button, Card, Dialog, etc.)

### Backend (`/backend`) - Express.js Microservices
- **Gateway** (`/backend/gateway`): Main entry point, handles auth via `verifyFirebaseToken` middleware
- **Services**: Domain-specific modules (`/backend/services/{domain}/src/routes.ts`):
  - `wallet` - Multi-currency accounts, balance management
  - `invoice` - Invoicing with PostgreSQL (migrated from Firestore)
  - `payment` - Payment intents, Stripe/Rapyd integration
  - `transaction` - Transfers, ledger entries
  - `user` - User management, KYC tier handling
  - Others: `fraud`, `notification`, `currency`, `support`, `content`, `business`
- **Database**: PostgreSQL + Prisma ORM (schema: `backend/prisma/schema.prisma`)
- **Authentication**: Firebase ID tokens verified at gateway

### Firebase (`/functions`) - Cloud Functions
- Handles admin operations, KYC notifications
- Email service via Mailgun/OneSignal
- Firestore listeners for cross-service events

## Data Model

- PostgreSQL database using Prisma ORM
- Key entities in `backend/prisma/schema.prisma`:
  - `User` - Core user data with KYC status
  - `Account` - Multi-currency wallets
  - `Transfer` - Money movement between accounts
  - `LedgerEntry` - Account balance changes

## API Patterns & Architecture

### Frontend-to-Backend Communication
**Pattern**: Frontend calls Next.js API route → API route calls backend service with bearer token

```typescript
// Frontend: /src/app/api/invoices/route.ts (typical pattern)
export async function GET(req: NextRequest) {
  const { token } = await requireAuth(req);  // Verify Firebase token
  const response = await fetch(
    buildBackendUrl('/api/invoices' + req.nextUrl.search),
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return backendResponseToNext(response);
}
```

**Key Auth Functions**:
- **`requireAuth(request)`** - `/src/lib/api/auth.ts`: Extracts & verifies Firebase bearer token, throws HttpError(401)
- **`verifyFirebaseToken`** - `/backend/gateway/auth-middleware.ts`: Backend middleware that decodes token
- **`requireKYC`** - Middleware ensuring user has completed verification
- **`requireRole(...roles)`** - Role-based access control middleware

### Backend Service Structure
Each service in `/backend/services/{name}/src/` follows pattern:
- `routes.ts` - Express Router with endpoints
- `service.ts` or controllers - Business logic
- `types.ts` - TypeScript interfaces
- README.md - API documentation

Example endpoint with auth:
```typescript
// /backend/services/invoice/src/routes.ts
router.get('/invoices',
  verifyFirebaseToken,  // Auth required
  requireKYC,           // KYC check
  async (req: AuthenticatedRequest, res) => {
    // req.user contains {uid, role, kycStatus}
  }
);
```

## Development Workflow

```bash
# Start development environment (frontend + backend)
npm run dev

# Frontend only (with mock backend)
npm run dev:client  # Port 3000

# Backend only (requires DB)
npm run dev:server  # Port 3001

# Build for production
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint

# Generate Prisma client (after schema changes)
npm run prisma:generate

# Create DB migration (after schema changes)
npx prisma migrate dev --name <migration-name>
```

**Important**: TypeScript build errors are ignored in `next.config.mjs` - **don't rely on this**. Always run `npm run typecheck` before committing.

## Common Pitfalls and Gotchas

1. **Port Conflicts**: Frontend runs on 3000, backend on 3001 - ensure no other services using these
2. **Environment Variables**: Frontend vars must start with `NEXT_PUBLIC_` to be accessible client-side. Backend vars in `backend/.env`
3. **Prisma Location**: Schema is in `backend/prisma/schema.prisma`, not root
4. **Firebase Admin Auth**: Use `firebaseAdminAuth.verifyIdToken()` not `firebase.auth().currentUser`
5. **API Route Proxy Pattern**: Frontend routes call backend via `buildBackendUrl()` - don't hardcode `localhost:3001`
6. **Browser vs Server**: Frontend components marked `'use client'` are hydrated on client. Firestore listeners only work client-side
7. **Mobile API Impact**: Changes to API contracts affect mobile app at `/mobile` - test both!
8. **KYC Gates**: Operations like transfers require `kycStatus === 'verified'` - always check before processing
9. **Money Precision**: Use Decimal everywhere for amounts. Zero decimals can cause issues in exchanges
10. **Import Paths**: Use `@/` aliases (configured in tsconfig), not relative paths

## When Making Changes

1. **Understand the context**: Read related code before changing - especially for money operations
2. **Check dependencies**: Changes may affect multiple services and the mobile app
3. **Test money operations**: Validate with multiple currencies and edge cases
4. **Verify KYC gates**: Ensure protected operations check KYC status
5. **Update API contracts**: Keep frontend and mobile API usage in sync
6. **Run linters**: Use `npm run lint` and `npm run typecheck` before committing
7. **Check migrations**: Prisma schema changes need `npx prisma migrate dev`
8. **Test print/PDF routes**: Invoice-related changes affect `/services/pdf-generator/InvoiceDocument.js`

## Project-Specific Conventions

### Frontend Components & Hooks
- **Always use 'use client' directive** for components with interactivity
- **`useAuth()`** hook provides Firebase user context: `const { user, loading } = useAuth()`
- **Firestore real-time listeners**: Use `onSnapshot(doc(...))` pattern in useEffect, return unsubscribe
- **Form handling**: Prefer react-hook-form + zod for validation
- **State management**: Direct useState for local state, Firestore listeners for shared data
- **Error display**: Use `useToast()` hook from `/src/hooks/use-toast.ts`

### API Route Conventions
- All authenticated routes must call `requireAuth(req)` first
- Return `NextResponse.json()` for success, `HttpError` for failures
- Use `buildBackendUrl()` to construct backend endpoints
- Never expose backend errors - sanitize in error response
- Pattern: Extract token → validate → fetch backend → return response

Example:
```typescript
// Correct pattern
export async function POST(req: NextRequest) {
  try {
    const { token } = await requireAuth(req);  // Throws if invalid
    const payload = await req.json();
    const res = await fetch(buildBackendUrl('/api/endpoint'), {
      headers: { Authorization: `Bearer ${token}` }
    });
    return await backendResponseToNext(res);
  } catch (error) {
    if (error instanceof HttpError) return NextResponse.json({...}, { status: error.status });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### Backend Service Patterns
- Services are independent Express apps mounted at `/backend/services/{name}`
- All routes protected with `verifyFirebaseToken` middleware
- Business logic in separate `service.ts` file (not in routes.ts)
- Queries use Prisma ORM: `prisma.{model}.findUnique()`, `create()`, `update()`
- Errors should use domain-specific error classes, not generic Error
- All money amounts use `Decimal` type (never `Number` or `float`)

### KYC/Compliance Gates
- Many operations require `kycStatus === 'verified'`
- Business accounts have `kycStatus` and `kycTier` (tier1, tier2, tier3)
- KYC verification workflow in `/src/lib/kyc/verification-workflow.ts`
- Free/low-cost providers: Sumsub (IDs), Dojah (African docs), ComplyAdvantage (AML), Twilio (phone OTP)

## Code Quality Guidelines

### Code Style
- Use TypeScript strict mode
- Follow existing naming conventions in each service
- Use `const` over `let` when possible
- Prefer functional components in React
- Use async/await over raw Promises

### Security Best Practices
- **Never log sensitive data** (passwords, tokens, financial details)
- **Always validate user input** before processing
- **Use parameterized queries** to prevent SQL injection
- **Validate JWT tokens** for all authenticated endpoints
- **Check KYC status** before allowing financial operations
- **Use idempotency keys** for money transfers
- **Encrypt sensitive data** at rest and in transit

### Financial Data Handling
- Use `Decimal` type from `decimal.js` for all currency amounts
- Never use `Number` or `float` for money operations
- Always validate currency codes against supported currencies
- Include proper audit trails for all financial transactions
- Test edge cases: zero amounts, negative amounts, currency mismatches

## Mobile App Integration

- React Native app in `/mobile`
- Shares authentication and API interfaces with web
- Uses same backend services

## Key Integration Points

1. **External Services**
   - Firebase Authentication
   - OneSignal for notifications
   - Payment provider integrations in `services/payment`
   - Stripe, Rapyd, and other payment gateways

2. **API Communication**
   - Backend gateway handles service routing
   - Frontend API routes proxy to backend services via `buildBackendUrl()`
   - All authenticated requests include Firebase token in Authorization header

## Dependency Management

### Adding New Dependencies
1. Check for security vulnerabilities before adding
2. Prefer well-maintained packages with recent updates
3. Avoid packages with known security issues
4. Document why the dependency is needed

```bash
# Add frontend dependency
npm install <package-name>

# Add backend dependency (in backend/)
cd backend && npm install <package-name>

# Add dev dependency
npm install --save-dev <package-name>
```

### Prisma Schema Changes
```bash
# After modifying schema.prisma
npm run prisma:generate

# Create migration
npx prisma migrate dev --name <migration-name>

# Apply migrations in production
npx prisma migrate deploy
```