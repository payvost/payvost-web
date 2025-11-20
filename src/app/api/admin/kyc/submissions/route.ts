import { NextRequest, NextResponse } from 'next/server';
import { db, admin } from '@/lib/firebase-admin';
import { verifySessionCookie, isAdmin } from '@/lib/auth-helpers';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifySessionCookie(sessionCookie);
    const hasAdminAccess = await isAdmin(decoded.uid);
    
    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    let query: FirebaseFirestore.Query = db.collection('kyc_submissions');
    
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    if (status) {
      query = query.where('status', '==', status);
    }

    // Execute query
    const snapshot = await query.orderBy('createdAt', 'desc').limit(limit).get();

    // Get storage bucket
    const bucket = admin.storage().bucket();

    // Process submissions and generate signed URLs for documents
    const submissions = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        // Generate signed URLs for documents
        const documentsWithUrls = await Promise.all(
          (data.documents || []).map(async (docItem: any) => {
            try {
              // Extract file path from storage URL
              // URL format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media
              let filePath: string | null = null;
              
              if (docItem.url) {
                // Try to extract path from URL
                const urlMatch = docItem.url.match(/\/o\/(.+?)(\?|$)/);
                if (urlMatch) {
                  filePath = decodeURIComponent(urlMatch[1]);
                } else {
                  // If URL doesn't match expected format, try constructing path from submission data
                  // Path format: kyc_submissions/{userId}/{submissionId}/{docKey}/{fileName}
                  const submissionId = doc.id;
                  const userId = data.userId;
                  const docKey = docItem.key;
                  const fileName = docItem.name;
                  if (userId && submissionId && docKey && fileName) {
                    filePath = `kyc_submissions/${userId}/${submissionId}/${docKey}/${fileName}`;
                  }
                }
              }

              if (filePath) {
                try {
                  const file = bucket.file(filePath);
                  const [exists] = await file.exists();
                  
                  if (exists) {
                    const [signedUrl] = await file.getSignedUrl({
                      action: 'read',
                      expires: '03-01-2500', // Long expiry for admin access
                    });
                    return { ...docItem, signedUrl, filePath };
                  } else {
                    console.warn(`File not found in storage: ${filePath}`);
                    return { ...docItem, signedUrl: docItem.url, filePath: null };
                  }
                } catch (storageError) {
                  console.error('Error generating signed URL:', storageError);
                  return { ...docItem, signedUrl: docItem.url, filePath: null };
                }
              }
              
              return { ...docItem, signedUrl: docItem.url, filePath: null };
            } catch (err) {
              console.error('Error processing document:', err);
              return { ...docItem, signedUrl: docItem.url, filePath: null };
            }
          })
        );

        // Convert Firestore timestamps to ISO strings
        const createdAt = data.createdAt?.toDate?.()?.toISOString() || 
                         (data.createdAt?._seconds ? new Date(data.createdAt._seconds * 1000).toISOString() : null) ||
                         data.createdAt ||
                         new Date().toISOString();
        
        const decidedAt = data.decidedAt ? 
          (typeof data.decidedAt === 'string' ? data.decidedAt : 
           data.decidedAt?.toDate?.()?.toISOString() || 
           (data.decidedAt?._seconds ? new Date(data.decidedAt._seconds * 1000).toISOString() : null)) : 
          null;

        return {
          id: doc.id,
          userId: data.userId,
          countryCode: data.countryCode,
          level: data.level,
          documents: documentsWithUrls,
          status: data.status || 'submitted',
          createdAt,
          decidedAt,
          decidedBy: data.decidedBy || null,
          rejectionReason: data.rejectionReason || null,
        };
      })
    );

    return NextResponse.json(submissions, { status: 200 });
  } catch (error) {
    console.error('Error fetching KYC submissions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to fetch KYC submissions',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

