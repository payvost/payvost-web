import { NextRequest } from 'next/server';
import { Document, Page, Text, View, StyleSheet, pdf as renderPdf } from '@react-pdf/renderer';
import { getAdminDb, getAdminStorage } from '../../../../../lib/firebaseAdmin';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 11, fontFamily: 'Helvetica' },
  header: { marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  muted: { color: '#555' },
  meta: { marginBottom: 10 },
  table: { marginTop: 12, borderTopWidth: 1, borderColor: '#e0e0e0' },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e0e0e0', paddingVertical: 6 },
  th: { fontWeight: 'bold', backgroundColor: '#f7f7f7' },
  colDesc: { width: '46%', paddingHorizontal: 6 },
  colQty: { width: '18%', paddingHorizontal: 6, textAlign: 'right' },
  colPrice: { width: '18%', paddingHorizontal: 6, textAlign: 'right' },
  colAmt: { width: '18%', paddingHorizontal: 6, textAlign: 'right' },
  totals: { marginTop: 12, alignItems: 'flex-end', gap: 4 },
});

function formatMoney(value: any, currency?: string) {
  const num = Number(value ?? 0);
  return `${currency || ''} ${num.toFixed(2)}`.trim();
}

function safeText(value: any): string {
  if (value == null) return '';
  if (value instanceof Date) return value.toLocaleDateString();
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') return String(value);
  // Avoid rendering objects/elements inside <Text/>
  return '';
}

function InvoicePDF({ invoice, businessProfile }: any) {
  const items = Array.isArray(invoice?.items) ? invoice.items : [];
  const currency = invoice?.currency || 'USD';

  const tsToDate = (v: any) => {
    if (!v) return undefined;
    if (typeof v === 'string' || typeof v === 'number') return new Date(v);
    const secs = v?._seconds ?? v?.seconds;
    return typeof secs === 'number' ? new Date(secs * 1000) : undefined;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{safeText(businessProfile?.name) || 'Invoice'}</Text>
          {safeText(businessProfile?.address) && (
            <Text style={styles.muted}>{safeText(businessProfile?.address)}</Text>
          )}
          {safeText(businessProfile?.email) && (
            <Text style={styles.muted}>{safeText(businessProfile?.email)}</Text>
          )}
        </View>

        <View style={styles.meta}>
          <Text>Invoice #: {safeText(invoice?.invoiceNumber) || safeText(invoice?.id) || 'N/A'}</Text>
          <Text>Issue Date: {safeText(tsToDate(invoice?.issueDate)) || '-'}</Text>
          <Text>Due Date: {safeText(tsToDate(invoice?.dueDate)) || '-'}</Text>
          <Text>Status: {safeText(invoice?.status) || 'Draft'}</Text>
        </View>

        <View style={styles.table}>
          <View style={[styles.tr, styles.th]}>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Price</Text>
            <Text style={styles.colAmt}>Amount</Text>
          </View>
          {items.map((it: any, i: number) => {
            const qty = Number(it?.quantity ?? 1);
            const price = Number(it?.price ?? it?.amount ?? 0);
            const amount = Number(it?.amount ?? qty * price);
            return (
              <View key={i} style={styles.tr}>
                <Text style={styles.colDesc}>{safeText(it?.description) || safeText(it?.name) || '-'}</Text>
                <Text style={styles.colQty}>{String(qty)}</Text>
                <Text style={styles.colPrice}>{String(formatMoney(price, currency))}</Text>
                <Text style={styles.colAmt}>{String(formatMoney(amount, currency))}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.totals}>
          <Text>Subtotal: {formatMoney(invoice?.subtotal, currency)}</Text>
          {invoice?.tax > 0 && <Text>Tax: {formatMoney(invoice.tax, currency)}</Text>}
          {invoice?.discount > 0 && <Text>Discount: -{formatMoney(invoice.discount, currency)}</Text>}
          <Text>Grand Total: {formatMoney(invoice?.grandTotal, currency)}</Text>
        </View>

        {safeText(invoice?.notes) && (
          <View style={{ marginTop: 16 }}>
            <Text>Notes:</Text>
            <Text style={styles.muted}>{safeText(invoice?.notes)}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

async function getPublicInvoiceAndBusiness(id: string) {
  const db = getAdminDb();
  const collections = ['invoices', 'businessInvoices'];
  let invoice: any = null;

  for (const col of collections) {
    const snap = await db.collection(col).doc(id).get();
    if (snap.exists) {
      const data = snap.data();
      if (data?.isPublic) {
        invoice = { id, ...data };
        break;
      }
    }
  }

  if (!invoice) return { invoice: null, businessProfile: null };

  let businessProfile: any = null;
  if (invoice.businessId) {
    const q = await db
      .collection('users')
      .where('businessProfile.id', '==', invoice.businessId)
      .limit(1)
      .get();
    if (!q.empty) {
      businessProfile = q.docs[0].data().businessProfile;
    }
  }
  return { invoice, businessProfile };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if (!id) return new Response('Missing id', { status: 400 });

    const { invoice, businessProfile } = await getPublicInvoiceAndBusiness(id);
    if (!invoice) return new Response('Invoice not found or not public', { status: 404 });

    // Optional storage cache: if file exists, serve it directly
    try {
      const storage = getAdminStorage();
      const file = storage.bucket().file(`invoices/${id}.pdf`);
      const [exists] = await file.exists();
      if (exists) {
        // cache hit: serve bytes directly
        const [contents] = await file.download();
        try { console.log(`[api/pdf/invoice] cache HIT id=${id}`); } catch {}
        // Directly return Buffer to avoid Blob usage in Node runtime
        return new Response(contents as any, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="invoice-${id}.pdf"`,
            'Cache-Control': 'public, max-age=3600',
            'X-PDF-Cache': 'HIT',
          },
        });
      }
    } catch {
      // ignore cache errors
    }

    const buffer = await renderPdf(
      <InvoicePDF invoice={invoice} businessProfile={businessProfile} />
    ).toBuffer();

    // Best-effort write-through cache to Storage for faster subsequent downloads
    try {
      const storage = getAdminStorage();
      const file = storage.bucket().file(`invoices/${id}.pdf`);
      await file.save(buffer, {
        contentType: 'application/pdf',
        resumable: false,
        metadata: { cacheControl: 'public, max-age=3600' },
      });
      try { console.log(`[api/pdf/invoice] cache SAVE id=${id}`); } catch {}
    } catch {
      // ignore caching failures
    }

    // Return Buffer directly to Response to avoid Blob in Node.js
    return new Response(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${id}.pdf"`,
        'Cache-Control': 'public, max-age=60',
        'X-PDF-Cache': 'MISS',
      },
    });
  } catch (e: any) {
    console.error('[api/pdf/invoice] error', e);
    return new Response('Failed to generate PDF', { status: 500, headers: { 'X-Error': String(e?.message || e) } });
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
