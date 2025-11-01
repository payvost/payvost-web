# Wallet Service

Manages user accounts and balances across multiple currencies.

## Features

- Multi-currency account support
- Balance inquiries
- Ledger entry tracking (double-entry accounting)
- Account creation with KYC verification
- Account type support (PERSONAL, BUSINESS)

## API Endpoints

### Get All Accounts
```
GET /api/wallet/accounts
Authentication: Required
KYC: Not required
```

Returns all accounts for the authenticated user.

**Response:**
```json
{
  "accounts": [
    {
      "id": "uuid",
      "userId": "uuid",
      "currency": "USD",
      "balance": "1000.00",
      "type": "PERSONAL",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### Create New Account
```
POST /api/wallet/accounts
Authentication: Required
KYC: Required
```

Creates a new account for the authenticated user.

**Request Body:**
```json
{
  "currency": "USD",
  "type": "PERSONAL"
}
```

**Response:**
```json
{
  "account": {
    "id": "uuid",
    "userId": "uuid",
    "currency": "USD",
    "balance": "0.00",
    "type": "PERSONAL",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

### Get Account Details
```
GET /api/wallet/accounts/:id
Authentication: Required
KYC: Not required
```

Returns detailed information about a specific account, including recent ledger entries.

### Get Account Balance
```
GET /api/wallet/accounts/:id/balance
Authentication: Required
KYC: Not required
```

Returns the current balance of a specific account.

**Response:**
```json
{
  "balance": "1000.00",
  "currency": "USD"
}
```

### Get Ledger Entries
```
GET /api/wallet/accounts/:id/ledger?limit=50&offset=0
Authentication: Required
KYC: Not required
```

Returns paginated ledger entries for a specific account.

## Business Logic

- Users can have multiple accounts in different currencies
- Each account has a unique ID and belongs to a single user
- Balances are stored with high precision (Decimal type)
- All balance changes are recorded in ledger entries
- Accounts require KYC verification to create
- Account type can be PERSONAL or BUSINESS

## Integration

The Wallet Service integrates with:
- **User Service**: Verifies user identity and KYC status
- **Transaction Service**: Updates balances during transfers
- **Core Banking**: Uses accounting engine for ledger entries

