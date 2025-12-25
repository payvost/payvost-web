# Firebase & Analytics Setup

This directory contains Firebase configuration and analytics services for the mobile app.

## Files

### `firebase.ts`
Initializes Firebase app, Analytics, and Auth services. Uses environment variables for configuration.

### `analytics.ts`
Analytics service wrapper with helper functions for tracking:
- Screen views
- User actions (login, signup, logout)
- Payment events
- Wallet events
- Card events

### `errorTracking.ts`
Error tracking and reporting service:
- Tracks errors with context
- Logs to console and Firebase Analytics
- Sets up global error handlers
- Provides `withErrorTracking` wrapper for async functions

## Usage

### Track Events
```typescript
import { trackEvent, trackUserAction } from '../lib/analytics';

// Custom event
await trackEvent('button_clicked', { button_name: 'send_money' });

// Predefined actions
await trackUserAction.login('email');
await trackUserAction.paymentCompleted(100, 'USD', 'transfer');
```

### Track Errors
```typescript
import { trackError, withErrorTracking } from '../lib/errorTracking';

// Manual error tracking
await trackError(new Error('Something went wrong'), {
  screen: 'Dashboard',
  action: 'load_wallets',
});

// Automatic error tracking wrapper
const safeFunction = withErrorTracking(async () => {
  // Your async code here
}, { screen: 'Dashboard' });
```

### Screen Tracking
```typescript
import { trackScreenView } from '../lib/analytics';

useEffect(() => {
  trackScreenView('Dashboard');
}, []);
```

## Environment Variables Required

Make sure these are set in your `.env` file:
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID` (optional, for Analytics)

