import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase-admin';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token
    const token = authHeader.replace('Bearer ', '');
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get the file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Upload to Firebase Storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `chat/${params.id}/${timestamp}-${sanitizedName}`;
    
    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(filename);

    // Upload file
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          uploadedBy: decodedToken.uid,
          sessionId: params.id,
          originalName: file.name,
        },
      },
    });

    // Make file publicly readable (or use signed URLs for private files)
    await fileRef.makePublic();

    // Get public URL
    const fileUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    // Generate thumbnail for images
    let thumbnailUrl: string | undefined;
    if (file.type.startsWith('image/')) {
      thumbnailUrl = fileUrl; // In production, generate actual thumbnail
    }

    return NextResponse.json({
      url: fileUrl,
      metadata: {
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        thumbnail: thumbnailUrl,
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

