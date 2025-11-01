# Transaction Service

Handles money transfers between accounts with ACID guarantees, fee calculation, and transaction history.

## Features

- Internal transfers between Payvost accounts
- Idempotency key support (prevents duplicate transactions)
- Automatic fee calculation and application
- Transaction limits (daily/monthly)
- Multi-currency support
- Transaction history with pagination
- ACID transaction guarantees

## API Endpoints

### Execute Transfer
```
POST /api/transaction/transfer
Authentication: Required
KYC: Required
```

Executes a transfer from one account to another.

**Request Body:**
```json
{
  "fromAccountId": "uuid",
  "toAccountId": "uuid",
  "amount": 100.00,
  "currency": "USD",
  "description": "Payment for services",
  "idempotencyKey": "optional-unique-key"
}
```

**Response:**
```json
{
  "transfer": {
    "id": "uuid",
    "fromAccountId": "uuid",
    "toAccountId": "uuid",
    "amount": "100.00",
    "currency": "USD",
    "status": "COMPLETED",
    "type": "INTERNAL_TRANSFER",
    "description": "Payment for services",
    "idempotencyKey": "optional-unique-key",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

**Error Responses:**
- `400`: Validation error, insufficient balance, or limit exceeded
- `404`: Source account not found
- `500`: Internal server error

### Get All Transfers
```
GET /api/transaction/transfers?limit=50&offset=0&status=COMPLETED
Authentication: Required
KYC: Not required
```

Returns paginated list of transfers for the authenticated user.

**Query Parameters:**
- `limit`: Number of results to return (default: 50)
- `offset`: Number of results to skip (default: 0)
- `status`: Filter by status (PENDING, COMPLETED, FAILED)

**Response:**
```json
{
  "transfers": [...],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0
  }
}
```

### Get Transfer Details
```
GET /api/transaction/transfers/:id
Authentication: Required
KYC: Not required
```

Returns detailed information about a specific transfer, including applied fees.

### Calculate Fees
```
POST /api/transaction/calculate-fees
Authentication: Required
KYC: Not required
```

Calculates fees for a potential transaction without executing it.

**Request Body:**
```json
{
  "amount": 100.00,
  "currency": "USD",
  "transactionType": "INTERNAL_TRANSFER",
  "fromCountry": "US",
  "toCountry": "US",
  "userTier": "STANDARD"
}
```

**Response:**
```json
{
  "feeAmount": "2.50",
  "breakdown": {
    "fixedFees": "1.00",
    "percentageFees": "1.50",
    "discounts": "0.00",
    "total": "2.50"
  },
  "appliedRules": [...]
}
```

## Business Logic

### Transfer Execution
1. Validate request parameters
2. Verify source account belongs to authenticated user
3. Check idempotency (prevent duplicate transactions)
4. Verify daily and monthly transfer limits
5. Lock accounts for update (prevent race conditions)
6. Verify sufficient balance
7. Calculate and apply fees
8. Update account balances
9. Create ledger entries
10. Record transfer in database

### Idempotency
- Transfers can include an `idempotencyKey` to prevent duplicates
- If not provided, a deterministic key is generated from transfer parameters
- Subsequent requests with the same key return the original transfer

### Transaction Limits
- Daily limit: $100,000 per account
- Monthly limit: $500,000 per account
- Limits are configurable per user tier (not yet implemented)

### Fee Calculation
- Fees are calculated based on:
  - Transaction type (INTERNAL_TRANSFER, EXTERNAL_TRANSFER, etc.)
  - Currency
  - Amount
  - User tier
  - Country (sender and receiver)
- Multiple fee rules can apply to a single transaction
- Fees are recorded separately in the `AppliedFee` table

## Integration

The Transaction Service integrates with:
- **Wallet Service**: Reads account information
- **Core Banking**: Uses `TransactionManager` for ACID transfers
- **Fee Engine**: Calculates and applies fees
- **Fraud Service**: Monitors suspicious transactions (not yet implemented)
- **Notification Service**: Sends transfer notifications (not yet implemented)

## Error Handling

- **Insufficient balance**: Returns 400 with error message
- **Account not found**: Returns 404
- **Daily/monthly limit exceeded**: Returns 400 with error message
- **Currency mismatch**: Returns 400
- **Duplicate idempotency key**: Returns existing transfer (200)

