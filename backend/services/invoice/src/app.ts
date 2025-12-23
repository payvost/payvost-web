import express, { Express, Request, Response } from 'express';
import invoiceRoutes from './routes';

const app: Express = express();

// Middleware
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'invoice-service' });
});

// Mount invoice routes
app.use('/api', invoiceRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'Invoice Service',
    status: 'running',
    version: '1.0.0'
  });
});

export default app;
