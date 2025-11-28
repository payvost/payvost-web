import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// Public API to fetch current published legal documents
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const docType = searchParams.get('type'); // 'terms' or 'privacy'

    if (!docType || !['terms', 'privacy'].includes(docType)) {
      return NextResponse.json(
        { error: 'Invalid document type. Must be "terms" or "privacy"' },
        { status: 400 }
      );
    }

    // Get current published version
    const snapshot = await db.collection('legalDocuments')
      .where('type', '==', docType)
      .where('status', '==', 'published')
      .orderBy('versionNumber', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'No published version found' },
        { status: 404 }
      );
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    return NextResponse.json({
      ...data,
      id: doc.id,
      publishedAt: data?.publishedAt?.toDate?.()?.toISOString(),
      createdAt: data?.createdAt?.toDate?.()?.toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching legal document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch legal document' },
      { status: 500 }
    );
  }
}

