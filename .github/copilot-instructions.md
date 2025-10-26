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

## Testing and Validation

- Run service-specific tests in each backend service directory
- API integration tests in `backend/tests`
- Frontend component tests with testing-library

Remember to:
- Update Prisma schema migrations carefully
- Test money operations with multiple currencies
- Validate KYC status for restricted operations
- Handle edge cases in transfer workflows