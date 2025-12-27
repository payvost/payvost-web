import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { prisma } from '../../common/prisma';
import { sendEmailViaMailgun } from './mailgun';
import { invoiceReminderCronJob } from './cron-jobs';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3006;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'notification-processor',
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'Payvost Notification Processor',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      send: 'POST /send',
      test: 'GET /test',
    },
  });
});

// Send notification endpoint
app.post('/send', async (req: Request, res: Response) => {
  try {
    const { type, email, subject, template, variables } = req.body;

    // Validate required fields
    if (!email || !type || !subject) {
      return res.status(400).json({
        error: 'Missing required fields: email, type, subject',
      });
    }

    // Send email
    const result = await sendEmailViaMailgun({
      to: email,
      subject,
      template: template || type,
      variables: variables || {},
    });

    // Log sent notification to database
    try {
      await prisma.sentNotification.create({
        data: {
          type,
          email,
          status: 'sent',
          sentAt: new Date(),
        },
      });
    } catch (dbError) {
      console.warn('Failed to log notification to database:', dbError);
    }

    res.json({
      success: true,
      messageId: result.id,
      message: 'Notification sent successfully',
    });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send notification',
    });
  }
});

// Test endpoint
app.get('/test', (_req: Request, res: Response) => {
  res.json({
    message: 'Notification processor is running',
    availableEndpoints: {
      'POST /send': 'Send a notification',
      'GET /health': 'Health check',
      'GET /': 'Service info',
    },
  });
});

// Initialize cron jobs
function initializeCronJobs() {
  console.log('🕐 Initializing cron jobs...');

  if (process.env.INVOICE_REMINDER_ENABLED === 'true') {
    const schedule = process.env.INVOICE_REMINDER_SCHEDULE || '0 9 * * *'; // Default: 9 AM UTC daily
    console.log(`📅 Scheduling invoice reminder cron job: ${schedule}`);

    cron.schedule(schedule, async () => {
      console.log('⏰ Running invoice reminder cron job...');
      try {
        await invoiceReminderCronJob();
        console.log('✅ Invoice reminder cron job completed successfully');
      } catch (error) {
        console.error('❌ Error running invoice reminder cron job:', error);
      }
    });
  }

  console.log('✅ Cron jobs initialized');
}

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║     🚀 Notification Processor Started                  ║
║     Port: ${PORT}                                           ║
║     Environment: ${process.env.NODE_ENV || 'development'}                            ║
║     Timestamp: ${new Date().toISOString()}  ║
╚════════════════════════════════════════════════════════╝
  `);

  // Initialize cron jobs after server starts
  initializeCronJobs();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

export default app;
