import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';

// Service health check functions
async function checkServiceHealth(serviceName: string): Promise<{
  status: 'Operational' | 'Degraded Performance' | 'Major Outage';
  responseTime?: number;
  lastChecked: string;
  details?: any;
}> {
  const startTime = Date.now();
  
  try {
    switch (serviceName) {
      case 'API Gateway':
        // Check if backend gateway is responding
        try {
          const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(5000),
          });
          const responseTime = Date.now() - startTime;
          if (response.ok && responseTime < 1000) {
            return { status: 'Operational', responseTime, lastChecked: new Date().toISOString() };
          } else if (responseTime < 3000) {
            return { status: 'Degraded Performance', responseTime, lastChecked: new Date().toISOString() };
          } else {
            return { status: 'Major Outage', responseTime, lastChecked: new Date().toISOString() };
          }
        } catch {
          return { status: 'Major Outage', lastChecked: new Date().toISOString() };
        }
      
      case 'Database Cluster':
        // Simulate database check (in production, check actual DB connection)
        const dbResponseTime = Math.random() * 200 + 50;
        if (dbResponseTime < 100) {
          return { status: 'Operational', responseTime: dbResponseTime, lastChecked: new Date().toISOString() };
        } else if (dbResponseTime < 300) {
          return { status: 'Degraded Performance', responseTime: dbResponseTime, lastChecked: new Date().toISOString() };
        } else {
          return { status: 'Major Outage', responseTime: dbResponseTime, lastChecked: new Date().toISOString() };
        }
      
      case 'Payment Processing':
        // Check payment gateway status (simulated)
        const paymentStatus = Math.random() > 0.15 ? 'Operational' : 'Degraded Performance';
        return { 
          status: paymentStatus as any, 
          responseTime: Math.random() * 500 + 100,
          lastChecked: new Date().toISOString(),
          details: {
            stripe: Math.random() > 0.1 ? 'Operational' : 'Degraded Performance',
            paypal: Math.random() > 0.2 ? 'Operational' : 'Degraded Performance',
            bankTransfer: 'Operational'
          }
        };
      
      case 'Third-Party FX Provider':
        // Simulate FX provider check
        const fxStatus = Math.random() > 0.1 ? 'Operational' : (Math.random() > 0.5 ? 'Degraded Performance' : 'Major Outage');
        return { 
          status: fxStatus as any, 
          responseTime: Math.random() * 800 + 200,
          lastChecked: new Date().toISOString() 
        };
      
      default:
        // Default: simulate operational with random response time
        return { 
          status: Math.random() > 0.1 ? 'Operational' : 'Degraded Performance' as any,
          responseTime: Math.random() * 300 + 50,
          lastChecked: new Date().toISOString() 
        };
    }
  } catch (error) {
    return { 
      status: 'Major Outage', 
      lastChecked: new Date().toISOString(),
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    try {
      await requireAuth(request);
    } catch (error) {
      // For development, allow unauthenticated requests with mock data
      // In production, remove this and require authentication
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    const services = [
      'API Gateway',
      'Authentication Service',
      'Payment Processing',
      'Settlement Engine',
      'Database Cluster',
      'Third-Party FX Provider',
      'Web Dashboard',
      'Email Notifications',
    ];

    // Check all services in parallel
    const serviceChecks = await Promise.all(
      services.map(async (serviceName) => {
        const health = await checkServiceHealth(serviceName);
        
        // Map service names to their components
        let components;
        if (serviceName === 'API Gateway') {
          components = [
            { name: 'Public API', status: health.status },
            { name: 'Internal API', status: health.status },
          ];
        } else if (serviceName === 'Payment Processing') {
          components = health.details ? [
            { name: 'Stripe Gateway', status: health.details.stripe || 'Operational' },
            { name: 'PayPal Gateway', status: health.details.paypal || 'Operational' },
            { name: 'Bank Transfer Processor', status: health.details.bankTransfer || 'Operational' },
          ] : undefined;
        }

        return {
          name: serviceName,
          status: health.status,
          description: getServiceDescription(serviceName, health.status),
          responseTime: health.responseTime,
          lastChecked: health.lastChecked,
          components,
          uptime: calculateUptime(serviceName, health.status),
        };
      })
    );

    // Calculate overall system status
    const hasOutage = serviceChecks.some(s => s.status === 'Major Outage');
    const hasDegraded = serviceChecks.some(s => s.status === 'Degraded Performance');
    const overallStatus = hasOutage ? 'Major Outage' : hasDegraded ? 'Degraded Performance' : 'Operational';

    // Get recent incidents (simulated - in production, fetch from database)
    const incidents = getRecentIncidents();

    return NextResponse.json({
      overallStatus,
      services: serviceChecks,
      incidents,
      lastUpdated: new Date().toISOString(),
      systemUptime: calculateSystemUptime(),
    });
  } catch (error) {
    console.error('Error fetching system status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system status', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function getServiceDescription(serviceName: string, status: string): string {
  const descriptions: Record<string, Record<string, string>> = {
    'API Gateway': {
      'Operational': 'All API endpoints are responding normally.',
      'Degraded Performance': 'Some API endpoints are experiencing delays.',
      'Major Outage': 'API Gateway is experiencing connectivity issues.',
    },
    'Authentication Service': {
      'Operational': 'User login and authentication are functioning correctly.',
      'Degraded Performance': 'Authentication requests are experiencing delays.',
      'Major Outage': 'Authentication service is unavailable.',
    },
    'Payment Processing': {
      'Operational': 'All payment gateways are processing transactions normally.',
      'Degraded Performance': 'We are experiencing intermittent delays with some payment providers.',
      'Major Outage': 'Payment processing is currently unavailable.',
    },
    'Settlement Engine': {
      'Operational': 'All automated settlements are processing on schedule.',
      'Degraded Performance': 'Settlement processing is experiencing delays.',
      'Major Outage': 'Settlement engine is currently unavailable.',
    },
    'Database Cluster': {
      'Operational': 'Database performance is normal.',
      'Degraded Performance': 'Database queries are experiencing slower response times.',
      'Major Outage': 'Database cluster is experiencing connectivity issues.',
    },
    'Third-Party FX Provider': {
      'Operational': 'FX rates are updating in real-time.',
      'Degraded Performance': 'FX rate updates are delayed. We have failed over to our secondary provider.',
      'Major Outage': 'Our primary FX rate provider is down. We have failed over to our secondary provider. Some rates may be slightly delayed.',
    },
    'Web Dashboard': {
      'Operational': 'The customer and admin dashboards are fully functional.',
      'Degraded Performance': 'Dashboard loading times are slower than usual.',
      'Major Outage': 'Web dashboard is currently unavailable.',
    },
    'Email Notifications': {
      'Operational': 'Transactional emails are being sent without delays.',
      'Degraded Performance': 'Email delivery is experiencing minor delays.',
      'Major Outage': 'Email notification service is currently unavailable.',
    },
  };

  return descriptions[serviceName]?.[status] || 'Service status unknown.';
}

function calculateUptime(serviceName: string, currentStatus: string): number {
  // Simulated uptime calculation (in production, calculate from historical data)
  const baseUptime = 99.5 + Math.random() * 0.5;
  if (currentStatus === 'Major Outage') {
    return Math.max(95, baseUptime - 2);
  } else if (currentStatus === 'Degraded Performance') {
    return Math.max(98, baseUptime - 0.5);
  }
  return baseUptime;
}

function calculateSystemUptime(): number {
  // Simulated system-wide uptime (in production, calculate from all services)
  return 99.7 + Math.random() * 0.3;
}

function getRecentIncidents() {
  // Simulated incident history (in production, fetch from database)
  return [
    {
      id: '1',
      title: 'Third-Party FX Provider Outage',
      description: 'Primary FX rate provider experienced connectivity issues. Automatically failed over to secondary provider.',
      status: 'resolved',
      severity: 'high',
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      resolvedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      affectedServices: ['Third-Party FX Provider'],
    },
    {
      id: '2',
      title: 'Payment Processing Delays',
      description: 'Intermittent delays detected with PayPal gateway. Transactions processed successfully but with increased latency.',
      status: 'monitoring',
      severity: 'medium',
      startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      affectedServices: ['Payment Processing'],
    },
  ];
}

