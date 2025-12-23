import express, { Express, Request, Response } from 'express';
import { InvoiceService } from './invoice-service';

const app: Express = express();

// Middleware
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'invoice-service' });
});

// Invoice routes would be added here
app.get('/api/invoices', (req: Request, res: Response) => {
  res.json({ message: 'Invoice service is running' });
});

export default app;
