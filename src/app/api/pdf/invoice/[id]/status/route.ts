import { NextRequest } from 'next/server';
import { getAdminDb, getAdminStorage } from '../../../../../../lib/firebaseAdmin';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

    // Check invoice existence and public visibility
    const db = getAdminDb();
    const collections = ['invoices', 'businessInvoices'] as const;
    let foundInCollection: string | null = null;
    let isPublic = false;

    for (const col of collections) {
      const snap = await db.collection(col).doc(id).get();
      if (snap.exists) {
        const data = snap.data() || {};
        isPublic = Boolean((data as any).isPublic);
        foundInCollection = col;
        break;
      }
    }

    // Check storage cache
    const storage = getAdminStorage();
    const file = storage.bucket().file(`invoices/${id}.pdf`);
    const [exists] = await file.exists();

    let storageInfo: any = null;
    if (exists) {
      try {
        const [metadata] = await file.getMetadata();
        storageInfo = {
          path: `invoices/${id}.pdf`,
          size: metadata.size ? Number(metadata.size) : null,
          updated: metadata.updated || null,
          contentType: metadata.contentType || null,
        };
      } catch {
        storageInfo = { path: `invoices/${id}.pdf` };
      }
    }

    const body = {
      id,
      collectionsChecked: collections,
      foundInCollection,
      isPublic,
      cache: exists ? 'HIT' : 'MISS',
      storage: storageInfo,
    };

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e: any) {
    const message = e?.message || String(e);
    return new Response(JSON.stringify({ error: 'Status check failed', message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
