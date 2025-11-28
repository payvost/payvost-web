import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// GET - Fetch legal documents (current published version or all versions)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const docType = searchParams.get('type'); // 'terms' or 'privacy'
    const version = searchParams.get('version'); // specific version ID, or 'current' for published
    const allVersions = searchParams.get('allVersions') === 'true';

    if (!docType || !['terms', 'privacy'].includes(docType)) {
      return NextResponse.json(
        { error: 'Invalid document type. Must be "terms" or "privacy"' },
        { status: 400 }
      );
    }

    if (version && version !== 'current') {
      // Get specific version
      const versionDoc = await db.collection('legalDocuments').doc(version).get();
      if (!versionDoc.exists) {
        return NextResponse.json(
          { error: 'Version not found' },
          { status: 404 }
        );
      }
      const data = versionDoc.data();
      return NextResponse.json({
        ...data,
        id: versionDoc.id,
        publishedAt: data?.publishedAt?.toDate?.()?.toISOString(),
        createdAt: data?.createdAt?.toDate?.()?.toISOString(),
      });
    }

    if (allVersions) {
      // Get all versions for a document type
      try {
        const snapshot = await db.collection('legalDocuments')
          .where('type', '==', docType)
          .orderBy('versionNumber', 'desc')
          .get();

        const versions = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            publishedAt: data?.publishedAt?.toDate?.()?.toISOString(),
            createdAt: data?.createdAt?.toDate?.()?.toISOString(),
          };
        });

        return NextResponse.json({ versions });
      } catch (indexError: any) {
        // If index doesn't exist, try without orderBy
        if (indexError.code === 9 || indexError.message?.includes('index')) {
          console.warn('Index not found, fetching without orderBy:', indexError);
          const snapshot = await db.collection('legalDocuments')
            .where('type', '==', docType)
            .get();

          const versions = snapshot.docs
            .map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                publishedAt: data?.publishedAt?.toDate?.()?.toISOString(),
                createdAt: data?.createdAt?.toDate?.()?.toISOString(),
              };
            })
            .sort((a, b) => (b.versionNumber || 0) - (a.versionNumber || 0));

          return NextResponse.json({ versions });
        }
        throw indexError;
      }
    }

    // Get current published version
    try {
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
    } catch (indexError: any) {
      // If index doesn't exist, try without orderBy
      if (indexError.code === 9 || indexError.message?.includes('index')) {
        console.warn('Index not found, fetching without orderBy:', indexError);
        const snapshot = await db.collection('legalDocuments')
          .where('type', '==', docType)
          .where('status', '==', 'published')
          .get();

        if (snapshot.empty) {
          return NextResponse.json(
            { error: 'No published version found' },
            { status: 404 }
          );
        }

        // Sort manually
        const docs = snapshot.docs
          .map((doc) => ({ doc, data: doc.data() }))
          .sort((a, b) => (b.data.versionNumber || 0) - (a.data.versionNumber || 0));

        const doc = docs[0].doc;
        const data = docs[0].data;
        return NextResponse.json({
          ...data,
          id: doc.id,
          publishedAt: data?.publishedAt?.toDate?.()?.toISOString(),
          createdAt: data?.createdAt?.toDate?.()?.toISOString(),
        });
      }
      throw indexError;
    }
  } catch (error: any) {
    console.error('Error fetching legal document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch legal document' },
      { status: 500 }
    );
  }
}

// POST - Create new version of legal document
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, content, status = 'draft', publish = false } = body;

    if (!type || !['terms', 'privacy'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid document type. Must be "terms" or "privacy"' },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Get the latest version number
    let versionNumber = 1;
    try {
      const latestSnapshot = await db.collection('legalDocuments')
        .where('type', '==', type)
        .orderBy('versionNumber', 'desc')
        .limit(1)
        .get();

      if (!latestSnapshot.empty) {
        const latestVersion = latestSnapshot.docs[0].data().versionNumber;
        versionNumber = latestVersion + 1;
      }
    } catch (indexError: any) {
      // If index doesn't exist, fetch all and sort manually
      if (indexError.code === 9 || indexError.message?.includes('index')) {
        console.warn('Index not found, fetching all to determine version:', indexError);
        const allSnapshot = await db.collection('legalDocuments')
          .where('type', '==', type)
          .get();

        if (!allSnapshot.empty) {
          const versions = allSnapshot.docs
            .map((doc) => doc.data().versionNumber || 0)
            .sort((a, b) => b - a);
          versionNumber = versions[0] + 1;
        }
      } else {
        throw indexError;
      }
    }

    // If publishing, archive previous published version
    if (publish || status === 'published') {
      const publishedSnapshot = await db.collection('legalDocuments')
        .where('type', '==', type)
        .where('status', '==', 'published')
        .get();

      const batch = db.batch();
      publishedSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { status: 'archived' });
      });
      await batch.commit();
    }

    // Create new version
    const newVersion = {
      type,
      content,
      status: publish || status === 'published' ? 'published' : 'draft',
      versionNumber,
      version: `v${versionNumber.toFixed(1)}`,
      publishedAt: publish || status === 'published' ? Timestamp.now() : null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      editor: body.editor || 'Admin User',
    };

    const docRef = await db.collection('legalDocuments').add(newVersion);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      version: newVersion,
    });
  } catch (error: any) {
    console.error('Error creating legal document version:', error);
    return NextResponse.json(
      { error: 'Failed to create legal document version' },
      { status: 500 }
    );
  }
}

// PUT - Update version (rollback or update)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { versionId, action, content } = body;

    if (!versionId) {
      return NextResponse.json(
        { error: 'Version ID is required' },
        { status: 400 }
      );
    }

    const versionDoc = await db.collection('legalDocuments').doc(versionId).get();
    if (!versionDoc.exists) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    const versionData = versionDoc.data();

    if (action === 'rollback') {
      // Rollback: Create a new published version with the old content
      let versionNumber = 1;
      try {
        const latestSnapshot = await db.collection('legalDocuments')
          .where('type', '==', versionData?.type)
          .orderBy('versionNumber', 'desc')
          .limit(1)
          .get();

        if (!latestSnapshot.empty) {
          const latestVersion = latestSnapshot.docs[0].data().versionNumber;
          versionNumber = latestVersion + 1;
        }
      } catch (indexError: any) {
        // If index doesn't exist, fetch all and sort manually
        if (indexError.code === 9 || indexError.message?.includes('index')) {
          console.warn('Index not found, fetching all to determine version:', indexError);
          const allSnapshot = await db.collection('legalDocuments')
            .where('type', '==', versionData?.type)
            .get();

          if (!allSnapshot.empty) {
            const versions = allSnapshot.docs
              .map((doc) => doc.data().versionNumber || 0)
              .sort((a, b) => b - a);
            versionNumber = versions[0] + 1;
          }
        } else {
          throw indexError;
        }
      }

      // Archive current published version
      const publishedSnapshot = await db.collection('legalDocuments')
        .where('type', '==', versionData?.type)
        .where('status', '==', 'published')
        .get();

      const batch = db.batch();
      publishedSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { status: 'archived' });
      });

      // Create new version with rolled back content
      const newVersion = {
        type: versionData?.type,
        content: versionData?.content,
        status: 'published',
        versionNumber,
        version: `v${versionNumber.toFixed(1)}`,
        publishedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        editor: body.editor || 'Admin User',
        rolledBackFrom: versionId,
      };

      const newDocRef = db.collection('legalDocuments').doc();
      batch.set(newDocRef, newVersion);
      await batch.commit();

      return NextResponse.json({
        success: true,
        id: newDocRef.id,
        version: newVersion,
      });
    } else if (action === 'update' && content) {
      // Update existing version
      await db.collection('legalDocuments').doc(versionId).update({
        content,
        updatedAt: Timestamp.now(),
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error updating legal document:', error);
    return NextResponse.json(
      { error: 'Failed to update legal document' },
      { status: 500 }
    );
  }
}

