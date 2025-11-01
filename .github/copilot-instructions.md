# Copilot Instructions for Payvost Web

## Project Architecture Overview

This is a full-stack fintech application with three main components:

1. **Frontend (Next.js)**
   - Located in `/src` - Main web application
   - Uses Next.js App Router with TypeScript
   - UI components use Radix UI primitives with custom styling
   - Key paths: `/src/app` (pages), `/src/components` (shared components)

2. **Backend Services**
   - Located in `/backend`
   - Microservices architecture with domain-specific services:
     - `services/wallet` - Account/balance management 
     - `services/payment` - Payment processing
     - `services/user` - User management and KYC
     - `services/transaction` - Transfer tracking
     - Additional supporting services for fraud, notifications, etc.

3. **Firebase Functions**
   - Located in `/functions`
   - Handles admin operations and notifications
   - Key files: `src/emailservice.ts`, `src/notificationTriggers.ts`

## Data Model

- PostgreSQL database using Prisma ORM
- Key entities in `backend/prisma/schema.prisma`:
  - `User` - Core user data with KYC status
  - `Account` - Multi-currency wallets
  - `Transfer` - Money movement between accounts
  - `LedgerEntry` - Account balance changes

## Development Workflow

```bash
# Start development environment (frontend + backend)
npm run dev

# Frontend only
npm run dev:client  # Port 3000

# Backend only
npm run dev:server  # Port 3001

# Build for production
npm run build
```

## Project-Specific Patterns

1. **Error Handling**
   - Backend services use domain-specific error classes
   - Frontend uses global error boundary in `src/app/error.tsx`

2. **Authentication**
   - Firebase Authentication for web/mobile
   - JWT validation in backend gateway
   - KYC status checks required for financial operations

3. **Money Operations**
   - Always use Decimal type for amounts
   - Currency codes must be validated against supported list
   - Transfers require idempotency keys

## Mobile App Integration

- React Native app in `/mobile`
- Shares authentication and API interfaces with web
- Uses same backend services

## Key Integration Points

1. **External Services**
   - Firebase Authentication
   - OneSignal for notifications
   - Payment provider integrations in `services/payment`

2. **API Communication**
   - Backend gateway handles service routing
   - Frontend uses typed API clients

## Development Commands

### Linting and Type Checking
```bash
# Run ESLint (frontend)
npm run lint

# TypeScript type checking
npm run typecheck
```

### Building
```bash
# Build frontend and backend
npm run build

# Build frontend only
npm run build:client

# Build backend only  
npm run build:server

# Generate Prisma client
npm run prisma:generate
```

### Testing and Validation

- Run service-specific tests in each backend service directory
- API integration tests in `backend/tests`
- Frontend component tests with testing-library

**Note**: Always run `npm run lint` and `npm run typecheck` before committing changes.

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

## Common Pitfalls and Gotchas

1. **Port Conflicts**: Frontend runs on 3000, backend on 3001
2. **TypeScript Errors Ignored**: `next.config.mjs` ignores build errors - don't rely on this
3. **Prisma Schema Location**: Schema is in `backend/prisma/schema.prisma`
4. **Environment Variables**: Check for required env vars before running
5. **Firebase Functions**: Separate deployment from main app
6. **Mobile App**: Changes to API contracts affect mobile app
7. **Currency Precision**: Always use Decimal for money, never float
8. **KYC Gates**: Many operations require verified KYC status

## File Structure Guidelines

- `/src/app` - Next.js App Router pages (frontend)
- `/src/components` - Reusable React components
- `/backend/services` - Microservices (wallet, payment, user, etc.)
- `/backend/gateway` - API gateway and routing
- `/backend/common` - Shared backend utilities
- `/functions` - Firebase Cloud Functions
- `/mobile` - React Native mobile app

## When Making Changes

1. **Understand the context**: Read related code before changing
2. **Check dependencies**: Changes may affect multiple services
3. **Test money operations**: Validate with multiple currencies and edge cases
4. **Verify KYC gates**: Ensure protected operations check KYC status
5. **Update API contracts**: Keep frontend and mobile in sync
6. **Run linters**: Use `npm run lint` and `npm run typecheck`
7. **Check migrations**: Prisma schema changes need migrations

Remember to:
- Update Prisma schema migrations carefully
- Test money operations with multiple currencies
- Validate KYC status for restricted operations
- Handle edge cases in transfer workflows