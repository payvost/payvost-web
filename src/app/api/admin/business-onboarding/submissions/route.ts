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
    let query: FirebaseFirestore.Query = db.collection('business_onboarding');
    
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    if (status) {
      query = query.where('status', '==', status);
    }

    // Execute query
    const snapshot = await query.orderBy('createdAt', 'desc').limit(limit).get();

    // Get storage bucket (with error handling)
    let bucket: any = null;
    try {
      const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
      if (storageBucket) {
        bucket = admin.storage().bucket(storageBucket);
      } else {
        bucket = admin.storage().bucket();
      }
    } catch (storageError: any) {
      console.warn('Storage bucket not configured, documents will use original URLs:', storageError.message);
      bucket = null;
    }

    // Process submissions and generate signed URLs for documents
    const submissions = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        // Generate signed URLs for documents
        const documentsWithUrls = await Promise.all(
          (data.documents || []).map(async (docItem: any) => {
            try {
              // If storage bucket is not available, just return the original URL
              if (!bucket) {
                return { ...docItem, signedUrl: docItem.url || null, filePath: null };
              }

              // Extract file path from storage URL
              let filePath: string | null = null;
              
              if (docItem.url) {
                const urlMatch = docItem.url.match(/\/o\/(.+?)(\?|$)/);
                if (urlMatch) {
                  filePath = decodeURIComponent(urlMatch[1]);
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
                    return { ...docItem, signedUrl, filePath, url: signedUrl };
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

        // Convert Firestore timestamps to ISO strings or keep as Timestamp
        const submittedAt = data.submittedAt || data.createdAt;
        const decidedAt = data.decidedAt;

        return {
          id: doc.id,
          userId: data.userId,
          name: data.name,
          type: data.type,
          industry: data.industry,
          registrationNumber: data.registrationNumber,
          taxId: data.taxId,
          address: data.address,
          email: data.email,
          website: data.website || null,
          documents: documentsWithUrls,
          status: data.status || 'submitted',
          submittedAt,
          createdAt: data.createdAt,
          decidedAt,
          decidedBy: data.decidedBy || null,
          rejectionReason: data.rejectionReason || null,
          adminResponse: data.adminResponse || null,
        };
      })
    );

    return NextResponse.json(submissions, { status: 200 });
  } catch (error) {
    console.error('Error fetching business onboarding submissions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to fetch business onboarding submissions',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

