import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import {
  checkAPIGatewayHealth,
  checkDatabaseHealth,
  checkAuthenticationServiceHealth,
  checkStripeHealth,
  checkPayPalHealth,
  checkFXProviderHealth,
  checkEmailServiceHealth,
  checkSettlementEngineHealth,
  checkWebDashboardHealth,
  storeHealthCheck,
  calculateUptime,
  detectAndStoreIncidents,
  type ServiceStatus,
} from '@/lib/health-check-service';
import { prisma } from '@/lib/prisma';

interface ServiceHealthData {
  name: string;
  status: ServiceStatus;
  description: string;
  responseTime?: number;
  lastChecked?: string;
  uptime?: number;
  components?: Array<{ name: string; status: ServiceStatus }>;
}

/**
 * Main health check function that routes to appropriate checker
 */
async function checkServiceHealth(serviceName: string): Promise<{
  status: ServiceStatus;
  responseTime?: number;
  lastChecked: string;
  details?: any;
}> {
  switch (serviceName) {
    case 'API Gateway':
      return await checkAPIGatewayHealth();
    
    case 'Database Cluster':
      return await checkDatabaseHealth();
    
    case 'Authentication Service':
      return await checkAuthenticationServiceHealth();
    
    case 'Payment Processing':
      // Check multiple payment gateways
      const [stripeHealth, paypalHealth] = await Promise.all([
        checkStripeHealth(),
        checkPayPalHealth(),
      ]);
      
      // Determine overall payment processing status
      let overallStatus: ServiceStatus;
      const responseTimes = [stripeHealth.responseTime, paypalHealth.responseTime].filter(Boolean) as number[];
      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : undefined;

      if (stripeHealth.status === 'Major Outage' && paypalHealth.status === 'Major Outage') {
        overallStatus = 'Major Outage';
      } else if (stripeHealth.status === 'Major Outage' || paypalHealth.status === 'Major Outage') {
        overallStatus = 'Degraded Performance';
      } else if (stripeHealth.status === 'Degraded Performance' || paypalHealth.status === 'Degraded Performance') {
        overallStatus = 'Degraded Performance';
      } else {
        overallStatus = 'Operational';
      }

      return {
        status: overallStatus,
        responseTime: avgResponseTime,
        lastChecked: new Date().toISOString(),
        details: {
          stripe: stripeHealth.status,
          paypal: paypalHealth.status,
          bankTransfer: 'Operational', // Bank transfers don't have external API to check
        },
      };
    
    case 'Third-Party FX Provider':
      return await checkFXProviderHealth();
    
    case 'Email Notifications':
      return await checkEmailServiceHealth();
    
    case 'Settlement Engine':
      return await checkSettlementEngineHealth();
    
    case 'Web Dashboard':
      return await checkWebDashboardHealth();
    
    default:
      // Default: assume operational
      return {
        status: 'Operational',
        lastChecked: new Date().toISOString(),
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
      // In production, require authentication
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
    const healthCheckResults = await Promise.all(
      services.map(async (serviceName) => {
        const health = await checkServiceHealth(serviceName);
        
        // Store health check result in database
        await storeHealthCheck(serviceName, health);
        
        // Calculate uptime from historical data
        const uptime = await calculateUptime(serviceName, 30);
        
        // Map service names to their components
        let components: Array<{ name: string; status: ServiceStatus }> | undefined;
        if (serviceName === 'API Gateway') {
          components = [
            { name: 'Public API', status: health.status },
            { name: 'Internal API', status: health.status },
          ];
        } else if (serviceName === 'Payment Processing' && health.details) {
          components = [
            { name: 'Stripe Gateway', status: health.details.stripe || 'Operational' },
            { name: 'PayPal Gateway', status: health.details.paypal || 'Operational' },
            { name: 'Bank Transfer Processor', status: health.details.bankTransfer || 'Operational' },
          ];
        }

        return {
          name: serviceName,
          status: health.status,
          description: getServiceDescription(serviceName, health.status),
          responseTime: health.responseTime,
          lastChecked: health.lastChecked,
          components,
          uptime,
        };
      })
    );

    // Detect and store incidents based on service status
    await detectAndStoreIncidents(
      healthCheckResults.map(s => ({
        name: s.name,
        status: s.status,
        lastChecked: s.lastChecked || new Date().toISOString(),
      }))
    );

    // Calculate overall system status
    const hasOutage = healthCheckResults.some(s => s.status === 'Major Outage');
    const hasDegraded = healthCheckResults.some(s => s.status === 'Degraded Performance');
    const overallStatus: ServiceStatus = hasOutage ? 'Major Outage' : hasDegraded ? 'Degraded Performance' : 'Operational';

    // Fetch recent incidents from database
    const recentIncidents = await prisma.systemIncident.findMany({
      where: {
        OR: [
          { status: { in: ['INVESTIGATING', 'MONITORING'] } },
          {
            status: 'RESOLVED',
            resolvedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        ],
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: 10,
    });

    // Map database incidents to API format
    const incidents = recentIncidents.map((incident: { id: string; title: string; description: string; status: string; severity: string; startedAt: Date; resolvedAt?: Date | null; affectedServices?: string[] }) => ({
      id: incident.id,
      title: incident.title,
      description: incident.description,
      status: incident.status.toLowerCase() as 'resolved' | 'monitoring' | 'investigating',
      severity: incident.severity.toLowerCase() as 'high' | 'medium' | 'low',
      startedAt: incident.startedAt.toISOString(),
      resolvedAt: incident.resolvedAt?.toISOString(),
      affectedServices: incident.affectedServices || [],
    }));

    // Calculate system-wide uptime from all services
    const systemUptime = await calculateSystemUptime(healthCheckResults);

    return NextResponse.json({
      overallStatus,
      services: healthCheckResults,
      incidents,
      lastUpdated: new Date().toISOString(),
      systemUptime,
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

/**
 * Calculate system-wide uptime from all service uptimes
 */
async function calculateSystemUptime(services: ServiceHealthData[]): Promise<number> {
  try {
    // Calculate average uptime across all services
    const uptimes = services.filter(s => s.uptime !== undefined).map(s => s.uptime!);
    
    if (uptimes.length === 0) {
      return 99.5; // Default if no uptime data
    }

    const avgUptime = uptimes.reduce((a, b) => a + b, 0) / uptimes.length;
    return Math.max(0, Math.min(100, avgUptime));
  } catch (error) {
    console.error('Failed to calculate system uptime:', error);
    return 99.5;
  }
}
