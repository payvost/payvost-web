import { NextRequest } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if (!id) return new Response('Missing id', { status: 400 });

    // Proxy to backend gateway which handles PDF generation via dedicated service
    const backendUrl = `${BACKEND_API_URL}/api/pdf/invoice/${id}`;
    
    console.log(`[api/pdf/invoice] Proxying to backend: ${backendUrl}`);
    
    const response = await fetch(backendUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[api/pdf/invoice] Backend error: ${response.status} - ${errorText}`);
      return new Response(`PDF generation failed: ${errorText}`, { 
        status: response.status,
        headers: { 'X-Error': `Backend ${response.status}` }
      });
    }

    // Forward the PDF from backend
    const buffer = Buffer.from(await response.arrayBuffer());
    
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/pdf',
        'Content-Disposition': response.headers.get('content-disposition') || `attachment; filename="invoice-${id}.pdf"`,
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (e: any) {
    console.error('[api/pdf/invoice] Proxy error:', e);
    return new Response('Failed to generate PDF', { 
      status: 500, 
      headers: { 'X-Error': String(e?.message || e) } 
    });
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
