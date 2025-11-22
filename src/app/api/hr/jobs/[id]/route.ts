import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { verifySessionCookie, isHrAdmin } from '@/lib/auth-helpers';
import { cookies } from 'next/headers';

// GET /api/hr/jobs/[id] - Get a single job (public)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const doc = await db.collection('jobs').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const job = {
      id: doc.id,
      ...doc.data(),
    };

    return NextResponse.json({ job });
  } catch (error: any) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

// PUT /api/hr/jobs/[id] - Update a job (HR only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('hr_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = await verifySessionCookie(sessionCookie);
    const isAdmin = await isHrAdmin(decoded.uid);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: HR Admin access required' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();

    const updateData = {
      ...body,
      updatedAt: new Date(),
    };

    await db.collection('jobs').doc(id).update(updateData);

    const doc = await db.collection('jobs').doc(id).get();
    const job = {
      id: doc.id,
      ...doc.data(),
    };

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error: any) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update job' },
      { status: 500 }
    );
  }
}

// DELETE /api/hr/jobs/[id] - Delete a job (HR only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('hr_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = await verifySessionCookie(sessionCookie);
    const isAdmin = await isHrAdmin(decoded.uid);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: HR Admin access required' },
        { status: 403 }
      );
    }

    const { id } = params;
    await db.collection('jobs').doc(id).delete();

    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete job' },
      { status: 500 }
    );
  }
}

