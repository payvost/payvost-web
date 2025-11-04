# Live FX Rates Page

A modern, sophisticated real-time foreign exchange rates page built with Next.js, TypeScript, and Radix UI.

## Features

### 🔴 Real-Time Updates
- Auto-refreshing exchange rates every 30 seconds
- Live update indicators with animations
- Manual refresh capability
- Last update timestamp display

### 📊 Interactive Visualizations
- **Grid View**: Detailed currency cards with comprehensive information
- **Compact View**: Sparkline charts showing 24-hour trends
- **Detailed Charts**: Modal view with historical data (24h, 7d, 30d, 1y timeframes)
- **Comparison Chart**: Side-by-side currency strength comparison

### 💱 Currency Converter
- Instant conversion between any two currencies
- Real-time rate calculation
- Support for 13+ global currencies
- Large, easy-to-read results display

### ⭐ Personalization
- Favorite currencies system
- Quick access to starred currencies
- Persistent favorites across sessions

### 🔍 Search & Filter
- Search by currency name, code, or country
- Real-time search results
- Filter by favorites

### 📈 Data Visualization
- 24-hour change indicators with trend arrows
- Color-coded gains (green) and losses (red)
- Interactive hover states on charts
- Historical trend visualization

### 🎨 Modern UI/UX
- Gradient backgrounds and glassmorphism effects
- Smooth animations and transitions
- Responsive design (mobile, tablet, desktop)
- Dark/light theme support
- Accessible components using Radix UI

## Currency Support

Currently supports 13 major currencies:
- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- NGN (Nigerian Naira)
- GHS (Ghanaian Cedi)
- KES (Kenyan Shilling)
- ZAR (South African Rand)
- JPY (Japanese Yen)
- CAD (Canadian Dollar)
- AUD (Australian Dollar)
- CHF (Swiss Franc)
- CNY (Chinese Yuan)
- INR (Indian Rupee)

## Technical Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Custom SVG-based visualizations

## Components

### Main Page (`/src/app/fx-rates/page.tsx`)
The primary FX rates page with all interactive features.

### Mini Rate Chart (`/src/components/fx/mini-rate-chart.tsx`)
- Compact sparkline visualizations
- 24-hour trend indicators
- Reusable currency card component

### Detailed Chart (`/src/components/fx/detailed-chart.tsx`)
- Full-featured interactive charts
- Multiple timeframe support
- Currency comparison bars
- Statistical information (high, low, average, volatility)

## Usage

### Navigate to the FX Rates Page
Visit `/fx-rates` in your browser or click "Live Exchange Rates" in the main navigation.

### View Exchange Rates
1. Select a base currency from the dropdown
2. Browse all available currencies or filter by favorites
3. Search for specific currencies using the search bar

### Convert Currencies
1. Enter an amount in the converter
2. Select source and target currencies
3. View instant conversion results

### View Detailed Charts
1. Hover over any currency card
2. Click the maximize icon
3. Explore different timeframes (24h, 7d, 30d, 1y)
4. View statistical data

### Manage Favorites
1. Hover over any currency card
2. Click the star icon to add/remove from favorites
3. Switch to the "Favorites" tab for quick access

## Integration with Backend

The page is designed to integrate with the existing currency service at `/backend/services/currency`:

```typescript
// Expected API endpoints:
GET /api/currency/rates?base=USD&target=EUR
GET /api/currency/supported
POST /api/currency/convert
```

### Mock Data
Currently uses simulated data for demonstration. To connect to real data:

1. Update the `fetchExchangeRates` function to call the backend API
2. Replace mock rate generation with actual API responses
3. Implement WebSocket connection for real-time updates (optional)

## Future Enhancements

- [ ] Rate alerts and notifications
- [ ] Historical data export (CSV, JSON)
- [ ] Advanced technical indicators
- [ ] Multiple base currency comparison
- [ ] Currency correlation matrix
- [ ] User preferences persistence
- [ ] Mobile app deep linking
- [ ] Social sharing of rates
- [ ] News feed integration
- [ ] Economic calendar

## Performance Optimizations

- Automatic polling with cleanup
- Efficient re-renders using React hooks
- Lazy loading of detailed charts
- SVG-based charts for performance
- Optimized search filtering
- Memoized calculations

## Accessibility

- Keyboard navigation support
- ARIA labels for screen readers
- Semantic HTML structure
- High contrast mode compatible
- Focus indicators
- Reduced motion support

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Notes

- Exchange rates update every 30 seconds automatically
- All amounts are displayed with 4 decimal precision
- Currency symbols are locale-aware
- Timestamps use local timezone
- Charts are interactive and touch-friendly

---

Built with ❤️ for Payvost
