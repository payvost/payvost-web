/**
 * Vercel API Route - Proxies currency-distribution requests to Render/Railway admin-stats service
 * This offloads heavy data aggregation from Vercel to prevent timeouts
 */

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log('[Admin Stats API] Proxying currency-distribution request...');

    // Proxy to admin-stats service (Render/Railway)
    const adminStatsServiceUrl = process.env.ADMIN_STATS_SERVICE_URL || 
                                 process.env.NEXT_PUBLIC_ADMIN_STATS_SERVICE_URL || 
                                 'https://payvost-admin-stat-service-00u8.onrender.com';

    const queryParams = new URLSearchParams();
    if (startDate) queryParams.set('startDate', startDate);
    if (endDate) queryParams.set('endDate', endDate);

    const url = `${adminStatsServiceUrl}/currency-distribution?${queryParams.toString()}`;
    console.log(`[Admin Stats API] Calling: ${url}`);

    const response = await fetch(url, {
      signal: AbortSignal.timeout(180000), // 3 minutes timeout for heavy queries
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`[Admin Stats API] Admin stats service returned ${response.status}: ${errorText}`);
      return NextResponse.json(
        { 
          error: 'Admin stats service unavailable',
          details: response.status === 504 ? 'Service timeout' : errorText
        },
        { status: response.status === 504 ? 504 : 503 }
      );
    }

    const data = await response.json();
    console.log('[Admin Stats API] Currency distribution fetched successfully');

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Admin Stats API] Error proxying to admin stats service:', error);
    
    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      return NextResponse.json(
        { 
          error: 'Admin stats service timeout',
          message: 'Currency distribution calculation took too long. Please try again or use a smaller date range.',
          details: 'Service may be processing large dataset'
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch currency distribution', details: error.message },
      { status: 500 }
    );
  }
}
