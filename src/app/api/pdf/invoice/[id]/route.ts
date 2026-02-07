import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { buildBackendUrl } from '@/lib/api/backend';

// Token-gated PDF serving. PDFs are cached in Firebase Storage under invoice_pdfs/{invoiceId}.pdf.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get('token');

  if (!id) return NextResponse.json({ error: 'Missing invoice ID' }, { status: 400 });
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 });

  // Validate token and ensure it matches the requested invoice id.
  const invoiceUrl = buildBackendUrl(`/api/v1/public/invoices/${encodeURIComponent(token)}`);
  const invoiceRes = await fetch(invoiceUrl, { method: 'GET', cache: 'no-store' });
  if (!invoiceRes.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const invoiceData: any = await invoiceRes.json().catch(() => null);
  if (!invoiceData || invoiceData.id !== id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const bucket = storageBucket ? adminStorage.bucket(storageBucket) : adminStorage.bucket();
  const fileName = `invoice_pdfs/${id}.pdf`;
  const file = bucket.file(fileName);

  let [exists] = await file.exists();
  let shouldRegenerate = false;

  if (exists) {
    try {
      const metadata = await file.getMetadata();
      const timeCreated = metadata[0]?.timeCreated;
      const uploadedTime = timeCreated ? new Date(timeCreated).getTime() : 0;
      const invoiceUpdatedTime = invoiceData.updatedAt ? new Date(invoiceData.updatedAt).getTime() : uploadedTime;
      if (invoiceUpdatedTime > uploadedTime) {
        shouldRegenerate = true;
        exists = false;
      }
    } catch {
      // If metadata fails, still try serving; worst-case it's slightly stale.
    }
  }

  if (!exists) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
      const generateResponse = await fetch(`${baseUrl}/api/generate-invoice-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: id, token }),
        signal: AbortSignal.timeout(120000),
      });

      if (generateResponse.ok) {
        // Wait briefly for upload to appear.
        for (let i = 0; i < 6; i++) {
          await new Promise(resolve => setTimeout(resolve, 3000));
          const [nowExists] = await file.exists();
          if (nowExists) {
            exists = true;
            break;
          }
        }
      }
    } catch {
      // Fall through to final error if still missing.
    }
  }

  if (!exists) {
    return NextResponse.json(
      { error: 'PDF not available', details: shouldRegenerate ? 'PDF cache was stale and regeneration failed' : 'PDF generation failed' },
      { status: 503 }
    );
  }

  const [buffer] = await file.download();

  // Best-effort analytics
  adminDb.collection('invoice_downloads').add({
    invoiceId: id,
    token,
    downloadedAt: FieldValue.serverTimestamp(),
    userAgent: req.headers.get('user-agent') || null,
  }).catch(() => {});

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="invoice-${id}.pdf"`,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
