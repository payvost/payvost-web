# Payvost Web Application

A full-stack fintech application for global payments and money transfers, built with Next.js, Prisma, and Firebase.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (Prisma Postgres recommended)
- Firebase account
- Vercel account (for deployment)

### Installation

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
   - Copy `.env.example` to `.env.development.local`
   - Fill in your database credentials, Firebase config, and API keys
   - See PRISMA_POSTGRES_SETUP.md for database setup

4. **Set up the database**
   ```bash
   # Generate Prisma Client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate deploy
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 📚 Documentation

- **[PRISMA_POSTGRES_SETUP.md](PRISMA_POSTGRES_SETUP.md)** - Database setup with Prisma Postgres
- **[VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)** - Deployment guide for Vercel
- **[VERCEL_SETUP.md](VERCEL_SETUP.md)** - Firebase service account setup for Vercel

## 🏗️ Project Structure

```
payvost-web/
├── src/                    # Next.js frontend application
│   ├── app/               # App router pages
│   └── components/        # React components
├── backend/               # Backend services
│   ├── prisma/           # Database schema and migrations
│   ├── services/         # Microservices (wallet, payment, user, etc.)
│   └── gateway/          # API gateway
├── functions/            # Firebase Cloud Functions
├── mobile/               # React Native mobile app
└── services/             # Additional backend services
```

## 🔧 Available Scripts

### Development
```bash
npm run dev              # Start both frontend and backend
npm run dev:client       # Start frontend only (port 3000)
npm run dev:server       # Start backend only (port 3001)
```

### Building
```bash
npm run build            # Build both frontend and backend
npm run build:client     # Build frontend only
npm run build:server     # Build backend only
```

### Database
```bash
npx prisma generate      # Generate Prisma Client
npx prisma migrate dev   # Create and apply migrations
npx prisma migrate deploy # Apply migrations in production
npx prisma studio        # Open Prisma Studio GUI
```

### Linting & Type Checking
```bash
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript compiler check
```

## 🗄️ Database

This project uses **Prisma** as the ORM with **PostgreSQL** database. The database schema includes:

- User management with KYC status
- Multi-currency accounts and wallets
- Transfer and transaction tracking
- Fee calculation engine
- Compliance and reporting

See `backend/prisma/schema.prisma` for the complete schema.

## 🔐 Environment Variables

Required environment variables (see `.env.example`):

### Database
- `DATABASE_URL` - PostgreSQL connection string

### Firebase
- `FIREBASE_SERVICE_ACCOUNT_KEY` - Service account JSON (Vercel only)
- `FIREBASE_DATABASE_URL` - Firebase Realtime Database URL
- `NEXT_PUBLIC_FIREBASE_*` - Firebase client configuration

### Payments
- `STRIPE_SECRET_KEY` - Stripe secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

### Notifications
- `ONESIGNAL_APP_ID` - OneSignal app ID
- `ONESIGNAL_API_KEY` - OneSignal API key

## 🚢 Deployment

### Vercel (Recommended)

1. Follow the guide in [PRISMA_POSTGRES_SETUP.md](PRISMA_POSTGRES_SETUP.md) to set up your database
2. Follow the guide in [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) to deploy
3. Set all environment variables in Vercel dashboard
4. Deploy using:
   ```bash
   vercel --prod
   ```

Or connect your GitHub repository to Vercel for automatic deployments.

## 🧪 Testing

```bash
# Run tests for specific services
cd backend/services/wallet && npm test
cd backend/services/payment && npm test
```

## 📱 Mobile App

The React Native mobile app is located in the `/mobile` directory. It shares the same backend services and authentication system.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run linters and tests
4. Submit a pull request

## 📄 License

Private - All rights reserved

## 🆘 Support

For issues and questions:
- Database setup: See PRISMA_POSTGRES_SETUP.md
- Deployment: See VERCEL_DEPLOYMENT.md
- Firebase: See VERCEL_SETUP.md
