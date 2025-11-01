# Payvost Web

A comprehensive fintech web application for international money transfers, bill payments, wallet management, and more.

## 🚀 Features

### Core Features (Phase 1 - Completed ✅)
- **Money Transfer**: Send money internationally with real-time exchange rates
- **Wallet Management**: Multi-currency wallet support (USD, EUR, GBP, NGN, GHS, KES, etc.)
- **Transaction History**: Complete transaction tracking and history
- **Currency Exchange**: Live exchange rates from multiple providers

### New Features (Phase 2 - Completed ✅)
- **Airtime Top-ups**: Send mobile airtime to any operator worldwide via Reloadly
- **Data Bundles**: Purchase data plans for mobile operators
- **Gift Cards**: Buy and send digital gift cards from popular brands
- **Utility Bill Payments**: Pay electricity, water, and other utility bills
- **Auto-detection**: Automatically detect mobile operator from phone number
- **Webhook Integration**: Real-time transaction status updates

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Development](#development)
- [Integration Partners](#integration-partners)
- [Documentation](#documentation)
- [Project Structure](#project-structure)

## 🎯 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Firebase project
- Reloadly account (for bill payments and airtime)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/payvost/payvost-web.git
   cd payvost-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your credentials (see [Environment Setup](#environment-setup))

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Environment Setup

Create a `.env.local` file with the following variables:

```bash
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Reloadly Integration
RELOADLY_CLIENT_ID=your_client_id
RELOADLY_CLIENT_SECRET=your_client_secret
RELOADLY_WEBHOOK_SECRET=your_webhook_secret
RELOADLY_ENV=sandbox  # or 'production'

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# ... other Firebase config

# Payment Gateways (Optional)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_key
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=your_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_key
```

See `.env.example` for the complete list of available environment variables.

## 🛠 Development

### Available Scripts

```bash
npm run dev          # Start development server (frontend + backend)
npm run dev:client   # Start frontend only (port 3000)
npm run dev:server   # Start backend only (port 3001)
npm run build        # Build for production
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking
npm run test         # Run tests
```

### Database Commands

```bash
npm run db:push      # Push schema changes to database
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
npm run db:status    # Check migration status
```

## 🔌 Integration Partners

Payvost integrates with multiple service providers:

### Financial Services
- **Reloadly** - Airtime, data, gift cards, utility bills
- **Paystack** - Nigerian payments
- **Flutterwave** - Multi-country payments
- **Stripe** - International payments

### Communication
- **SendGrid** - Email services
- **Twilio** - SMS and voice
- **Africa's Talking** - African SMS and airtime
- **OneSignal** - Push notifications

### KYC & Compliance
- **Smile Identity** - KYC verification
- **Onfido** - Document verification
- **ComplyAdvantage** - AML screening

### Data & Utilities
- **Exchange Rate APIs** - Real-time currency rates
- **Firebase** - Authentication and cloud functions

For detailed endpoint documentation, see [Integration Partners Reference](docs/INTEGRATION_PARTNERS_REFERENCE.md).

## 📚 Documentation

- **[Reloadly Integration Guide](docs/RELOADLY_INTEGRATION.md)** - Complete guide for Reloadly services
- **[Integration Partners Reference](docs/INTEGRATION_PARTNERS_REFERENCE.md)** - Quick reference for all API endpoints
- **[Architecture Diagram](ARCHITECTURE_DIAGRAM.md)** - System architecture overview
- **[Wiring Documentation](WIRING_DOCS_README.md)** - Frontend-backend integration guide

## 📁 Project Structure

```
payvost-web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Dashboard pages
│   │   │   ├── payments/       # Payment features (bill pay, gift cards)
│   │   │   ├── wallets/        # Wallet management
│   │   │   └── ...
│   │   └── api/                # API routes
│   │       └── webhooks/       # Webhook handlers
│   ├── components/             # React components
│   ├── services/               # API service layer
│   │   ├── apiClient.ts        # Base HTTP client
│   │   ├── reloadlyService.ts  # Reloadly integration
│   │   ├── walletService.ts    # Wallet operations
│   │   ├── transactionService.ts # Transaction management
│   │   └── currencyService.ts  # Exchange rates
│   ├── config/                 # Configuration files
│   │   └── integration-partners.ts # Partner API endpoints
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility libraries
│   └── types/                  # TypeScript type definitions
├── backend/                    # Backend microservices
│   ├── services/               # Service implementations
│   │   ├── wallet/
│   │   ├── transaction/
│   │   ├── currency/
│   │   └── ...
│   ├── prisma/                 # Database schema
│   └── gateway/                # API gateway
├── docs/                       # Documentation
└── functions/                  # Firebase Cloud Functions
```

## 🔐 Security

- All API credentials stored in environment variables
- Webhook signature verification for external callbacks
- JWT-based authentication
- HTTPS required for production
- Rate limiting on API endpoints

## 🧪 Testing

### Sandbox Testing

For development, use sandbox credentials:

```bash
RELOADLY_ENV=sandbox
```

Test with Reloadly's sandbox endpoints before going to production.

### Testing Checklist

- [ ] Authentication and token caching
- [ ] Wallet creation and balance updates
- [ ] Money transfers between accounts
- [ ] Airtime top-ups
- [ ] Gift card purchases
- [ ] Bill payments
- [ ] Webhook reception
- [ ] Error handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential.

## 📞 Support

For support, email support@payvost.com or visit our support center.

## 🙏 Acknowledgments

- Reloadly for airtime, data, and utility services
- Firebase for authentication and cloud functions
- All our integration partners for their excellent APIs

---

Built with ❤️ by the Payvost Team
