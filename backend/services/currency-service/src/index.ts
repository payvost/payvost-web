import express from 'express';
import cors from 'cors';
import currencyRoutes from './routes';
import { currencyService } from './currencyService';

const app = express();
const PORT = process.env.CURRENCY_SERVICE_PORT || 3010;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'currency-service', timestamp: new Date().toISOString() });
});

// Mounting the modular routes
app.use('/', currencyRoutes);

// Exporting currencyService for internal use within the microservice if needed
export { currencyService };

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Currency Service] Running on port ${PORT}`);
  });
}

export default app;
