# Service Boundaries & Architecture Documentation

## Overview

This document defines the service boundaries, interfaces, and communication patterns for the Payvost platform.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Web App    │  │  Mobile App  │  │   Admin UI   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼─────────────────┼─────────────────┼──────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    API Gateway Layer                           │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Authentication │ Rate Limiting │ Request Routing   │    │
│  └──────────────────────────────────────────────────────┘    │
└───────────────────────────┬───────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐
│  Core Banking  │  │   Payment     │  │   Notification │
│    Service     │  │   Service     │  │    Service     │
└───────┬────────┘  └───────┬────────┘  └───────┬────────┘
        │                   │                   │
┌───────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐
│  Transaction   │  │   Fraud       │  │   Currency      │
│    Service     │  │   Service     │  │    Service      │
└───────┬────────┘  └───────┬────────┘  └───────┬────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                ┌───────────▼───────────┐
                │   Database Layer     │
                │  ┌──────┐  ┌──────┐  │
                │  │Prisma│  │Fire- │  │
                │  │  DB  │  │store │  │
                │  └──────┘  └──────┘  │
                └──────────────────────┘
```

## Service Definitions

### 1. API Gateway Service

**Responsibility:**
- Request routing to appropriate services
- Authentication and authorization
- Rate limiting
- Request/response logging
- Error handling
- API versioning

**Interfaces:**
- HTTP REST API (`/api/v1/*`)
- WebSocket (for chat/notifications)

**Dependencies:**
- Firebase Admin SDK (authentication)
- All backend services

**Port:** 3001

---

### 2. Core Banking Service

**Responsibility:**
- Account management
- Transaction processing
- Balance management
- Ledger entries
- Transfer execution

**Key Operations:**
- `transferFunds()` - Execute transfers
- `createAccount()` - Create new accounts
- `getBalance()` - Get account balance
- `getLedger()` - Get transaction history

**Interfaces:**
- Internal API (via Gateway)
- Direct service-to-service calls

**Dependencies:**
- Prisma (database)
- Compliance Manager
- Fee Engine
- Audit Logger

**Port:** Internal (via Gateway)

---

### 3. Transaction Service

**Responsibility:**
- Transaction lifecycle management
- Transaction queries and filtering
- Transaction status tracking
- Fee calculation

**Key Operations:**
- `POST /api/v1/transaction/transfer` - Create transfer
- `GET /api/v1/transaction/transfers` - List transfers
- `POST /api/v1/transaction/calculate-fees` - Calculate fees

**Interfaces:**
- REST API via Gateway

**Dependencies:**
- Transaction Manager
- Fee Engine
- Compliance Manager
- Audit Logger

---

### 4. Payment Service

**Responsibility:**
- Payment intent creation
- Payment provider integration (Stripe, Rapyd, etc.)
- Payment status tracking
- Payment routing logic

**Key Operations:**
- `POST /api/v1/payment/create-intent` - Create payment intent
- `GET /api/v1/payment/status/:id` - Get payment status

**Interfaces:**
- REST API via Gateway
- Webhook endpoints for providers

**Dependencies:**
- Payment Provider Registry
- External payment APIs
- Audit Logger

**Payment Providers:**
- Stripe
- Rapyd
- Paystack
- Flutterwave
- FedNow
- SEPA

---

### 5. Wallet Service

**Responsibility:**
- Wallet/account CRUD operations
- Balance inquiries
- Account creation
- Multi-currency support

**Key Operations:**
- `GET /api/v1/wallet/accounts` - List accounts
- `POST /api/v1/wallet/accounts` - Create account
- `POST /api/v1/wallet/deposit` - Deposit funds
- `POST /api/v1/wallet/deduct` - Deduct funds

**Interfaces:**
- REST API via Gateway

**Dependencies:**
- Prisma (database)
- Rapyd (external wallet provider)
- Audit Logger

---

### 6. Fraud Service

**Responsibility:**
- Fraud detection and scoring
- Risk assessment
- Pattern analysis
- Alert generation

**Key Operations:**
- `POST /api/fraud/check` - Check transaction for fraud
- `GET /api/fraud/risk-score` - Get risk score

**Interfaces:**
- Internal API (via Gateway)

**Dependencies:**
- Compliance Manager
- Transaction data
- External fraud APIs (optional)

---

### 7. Compliance Service (Compliance Manager)

**Responsibility:**
- AML compliance checking
- Sanctions screening
- Transaction pattern analysis
- Compliance alert generation

**Key Operations:**
- `checkAMLCompliance()` - Check AML rules
- `checkFraudRisk()` - Assess fraud risk
- `checkSanctions()` - Screen against sanctions

**Interfaces:**
- Internal (used by other services)

**Dependencies:**
- Prisma (database)
- External sanctions databases (optional)

---

### 8. Notification Service

**Responsibility:**
- Email notifications
- SMS notifications
- Push notifications
- Notification preferences

**Key Operations:**
- `POST /api/v1/notification/send` - Send notification
- `POST /api/v1/notification/preferences` - Update preferences

**Interfaces:**
- REST API via Gateway

**Dependencies:**
- Mailgun (email)
- Twilio (SMS)
- Firebase Cloud Messaging (push)
- Firestore (preferences)

---

### 9. Currency Service

**Responsibility:**
- Exchange rate fetching
- Currency conversion
- Rate alerts
- Historical rates

**Key Operations:**
- `GET /api/v1/currency/rates` - Get exchange rates
- `POST /api/v1/currency/convert` - Convert currency

**Interfaces:**
- REST API via Gateway

**Dependencies:**
- External exchange rate APIs (Fixer, OpenExchange)
- Redis (caching)

---

### 10. Escrow Service

**Responsibility:**
- Escrow transaction management
- Milestone tracking
- Dispute resolution
- Fund release management

**Key Operations:**
- `POST /api/v1/escrow` - Create escrow
- `POST /api/v1/escrow/:id/fund` - Fund escrow
- `POST /api/v1/escrow/:id/dispute` - Raise dispute

**Interfaces:**
- REST API via Gateway

**Dependencies:**
- Prisma (database)
- Transaction Manager
- Audit Logger

---

## Service Communication Patterns

### 1. Synchronous Communication (HTTP)

**Pattern:** Request-Response via API Gateway

```
Client → Gateway → Service → Database
         ↓
      Response
```

**Use Cases:**
- User-initiated operations
- Real-time queries
- Immediate responses required

**Example:**
```typescript
// Client requests transfer
POST /api/v1/transaction/transfer
→ Gateway routes to Transaction Service
→ Transaction Service calls Core Banking Service
→ Response returned to client
```

### 2. Asynchronous Communication (Events)

**Pattern:** Event-driven via webhooks/events

```
Service A → Event → Service B (webhook)
```

**Use Cases:**
- Payment provider webhooks
- Notification triggers
- Background processing

**Example:**
```typescript
// Rapyd sends webhook
Rapyd → Gateway → Payment Service
→ Payment Service updates transaction
→ Notification Service sends email
```

### 3. Internal Service Calls

**Pattern:** Direct service-to-service calls

```
Service A → Service B (internal API)
```

**Use Cases:**
- Core Banking → Compliance Manager
- Transaction Service → Fee Engine
- Internal orchestration

**Example:**
```typescript
// Transaction Service calls Compliance Manager
transactionService.executeTransfer()
  → complianceManager.checkAMLCompliance()
  → complianceManager.checkFraudRisk()
```

## Data Flow Examples

### Transfer Flow

```
1. Client → POST /api/v1/transaction/transfer
2. Gateway → Authenticates & routes
3. Transaction Service → Validates input
4. Compliance Manager → Checks AML & fraud
5. Transaction Manager → Executes transfer
6. Database → Updates balances & creates ledger
7. Audit Logger → Records transaction
8. Notification Service → Sends confirmation
9. Response → Returns to client
```

### Payment Flow

```
1. Client → POST /api/v1/payment/create-intent
2. Gateway → Authenticates
3. Payment Service → Selects provider
4. Payment Provider → Creates payment intent
5. Response → Returns client secret
6. Client → Completes payment (frontend)
7. Provider → Sends webhook
8. Payment Service → Updates transaction
9. Notification Service → Sends receipt
```

## Service Contracts

### Authentication Contract

**All services require:**
- Firebase ID token in `Authorization: Bearer <token>` header
- Valid, non-expired token
- User must exist in system

**Response on failure:**
```json
{
  "error": "Authentication required",
  "message": "Missing or invalid authorization header"
}
```

### Idempotency Contract

**Payment/Transaction operations require:**
- `idempotencyKey` in request body
- Format: alphanumeric with dashes/underscores, max 255 chars
- Duplicate keys return same result

**Response on duplicate:**
```json
{
  "paymentId": "existing-id",
  "message": "Payment intent already exists (idempotent)"
}
```

### Error Response Contract

**Standard error format:**
```json
{
  "error": "Error type",
  "message": "Human-readable message",
  "code": "ERROR_CODE" // Optional
}
```

**HTTP Status Codes:**
- `400` - Validation error
- `401` - Authentication required
- `403` - Authorization failed / KYC required
- `404` - Resource not found
- `429` - Rate limit exceeded
- `500` - Internal server error
- `503` - Service unavailable

## Service Dependencies Graph

```
API Gateway
├── User Service
├── Wallet Service
│   └── Core Banking Service
├── Transaction Service
│   ├── Core Banking Service
│   ├── Compliance Manager
│   └── Fee Engine
├── Payment Service
│   └── Payment Providers (external)
├── Notification Service
│   ├── Mailgun (external)
│   ├── Twilio (external)
│   └── Firebase FCM (external)
├── Currency Service
│   └── Exchange Rate APIs (external)
└── Escrow Service
    └── Core Banking Service
```

## Database Access Patterns

### Prisma Database (PostgreSQL)
- **Used by:** Core Banking, Transactions, Escrow, Content
- **Access:** Via Prisma Client
- **Transactions:** Use Prisma transactions for ACID guarantees

### Firestore
- **Used by:** User profiles, Notifications, Chat
- **Access:** Via Firebase Admin SDK
- **Pattern:** Document-based, real-time updates

## Security Boundaries

### Public Endpoints
- `/health` - Health check
- `/api/versions` - API version info
- Webhook endpoints (with signature verification)

### Authenticated Endpoints
- All `/api/v1/*` endpoints (except public)
- Require Firebase token

### KYC-Required Endpoints
- Financial operations (transfers, payments)
- Account creation
- Wallet operations

### Admin-Only Endpoints
- `/api/admin/*` endpoints
- Require admin role

## Service Isolation

### Data Isolation
- Each service has its own data models
- Services don't directly access other services' databases
- Communication via APIs only

### Error Isolation
- Service failures don't cascade
- Circuit breaker pattern (future)
- Graceful degradation

### Deployment Isolation
- Services can be deployed independently
- Version compatibility maintained
- Backward compatibility required

## Monitoring & Observability

### Metrics
- Request rate per service
- Response times (p50, p95, p99)
- Error rates
- Active connections

### Logging
- Structured logging (Pino)
- Correlation IDs
- Request/response logging
- Error tracking

### Tracing
- Request tracing across services
- Performance profiling
- Dependency mapping

## Future Improvements

1. **Service Mesh:** Consider Istio/Linkerd for advanced routing
2. **Event Bus:** Implement event-driven architecture
3. **Caching Layer:** Redis for frequently accessed data
4. **Message Queue:** For async processing
5. **API Gateway:** Consider Kong/Apigee for advanced features

