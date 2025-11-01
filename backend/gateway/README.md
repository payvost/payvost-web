# API Gateway

The Payvost API Gateway serves as the central entry point for all backend services. It handles:

- **Request Routing**: Routes requests to appropriate microservices
- **Authentication**: Firebase token verification and JWT validation
- **Authorization**: Role-based access control (RBAC)
- **KYC Validation**: Ensures users have completed identity verification for restricted operations
- **Error Handling**: Domain-specific error classes with appropriate HTTP status codes
- **Request Logging**: Tracks all API requests with timing information

## Architecture

```
Client → Gateway → Services
                 ├── User Service
                 ├── Wallet Service
                 ├── Transaction Service
                 ├── Payment Service
                 ├── Currency Service
                 ├── Fraud Service
                 └── Notification Service
```

## Key Components

### `index.ts`
- Creates and configures the Express gateway application
- Registers service routes
- Global error handler
- Request logger middleware
- Health check endpoint

### `middleware.ts`
- `verifyFirebaseToken`: Validates Firebase ID tokens
- `verifyJWT`: Validates JWT tokens (alternative auth method)
- `requireRole`: Ensures user has required role(s)
- `requireKYC`: Ensures user has completed KYC verification
- `requireAdmin`: Shorthand for admin-only endpoints
- `optionalAuth`: Adds user info if authenticated, but doesn't require it

## Error Classes

- **AuthenticationError** (401): Invalid or missing credentials
- **AuthorizationError** (403): Insufficient permissions
- **ValidationError** (400): Invalid request data
- **KYCError** (403): KYC verification required
- **ServiceError** (503): Service unavailable

## Service Endpoints

### User Service (`/api/user`)
- User registration, login, profile management
- KYC status updates
- Role management

### Wallet Service (`/api/wallet`)
- Account creation and management
- Balance inquiries
- Ledger entries

### Transaction Service (`/api/transaction`)
- Transfer execution
- Transaction history
- Fee calculation

### Payment Service (`/api/payment`)
- Payment provider integrations
- Card payments
- External transfers

### Currency Service (`/api/currency`)
- Exchange rates
- Currency conversion
- Multi-currency support

### Fraud Service (`/api/fraud`)
- Transaction monitoring
- Risk scoring
- Compliance alerts

### Notification Service (`/api/notification`)
- Email notifications
- Push notifications
- SMS alerts

## Usage Example

```typescript
// Protected endpoint requiring KYC
router.post('/transfer', 
  verifyFirebaseToken, 
  requireKYC, 
  async (req: AuthenticatedRequest, res: Response) => {
    // Transfer logic
  }
);

// Admin-only endpoint
router.get('/users', 
  verifyFirebaseToken, 
  requireAdmin, 
  async (req: AuthenticatedRequest, res: Response) => {
    // Admin logic
  }
);
```

## Health Check

```
GET /health
```

Returns server status and uptime information.

## Environment Variables

- `PORT`: Server port (default: 3001)
- `JWT_SECRET`: Secret key for JWT signing
- `FRONTEND_URL`: Allowed CORS origin
- `NODE_ENV`: Environment (development/production)

