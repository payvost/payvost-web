import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { verifySessionCookie, isHrAdmin } from '@/lib/auth-helpers';
import { cookies } from 'next/headers';

// GET /api/hr/applications - Get applications (HR only or job seeker's own)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const jobId = searchParams.get('jobId');
    const userId = searchParams.get('userId'); // For job seeker to get their own

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('hr_session')?.value || cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = await verifySessionCookie(sessionCookie);
    const isAdmin = await isHrAdmin(decoded.uid);

    let query: FirebaseFirestore.Query = db.collection('jobApplications');

    // If userId param is provided and user is not HR admin, only show their own
    if (userId && userId === decoded.uid) {
      query = query.where('userId', '==', decoded.uid);
    } else if (userId && !isAdmin) {
      // User trying to access someone else's applications
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // HR can filter by status and jobId
    if (isAdmin) {
      if (status) {
        query = query.where('status', '==', status);
      }
      if (jobId) {
        query = query.where('jobId', '==', jobId);
      }
    }

    const snapshot = await query.orderBy('appliedAt', 'desc').get();
    const applications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ applications });
  } catch (error: any) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

// POST /api/hr/applications - Create a new application
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value; // Regular user session
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to apply.' },
        { status: 401 }
      );
    }

    const decoded = await verifySessionCookie(sessionCookie);
    const body = await request.json();

    const {
      jobId,
      coverLetter,
      resumeUrl,
      answers,
    } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Verify job exists
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const jobData = jobDoc.data();
    if (jobData?.status !== 'active') {
      return NextResponse.json(
        { error: 'This job is no longer accepting applications' },
        { status: 400 }
      );
    }

    // Check if user already applied
    const existingApp = await db.collection('jobApplications')
      .where('jobId', '==', jobId)
      .where('userId', '==', decoded.uid)
      .limit(1)
      .get();

    if (!existingApp.empty) {
      return NextResponse.json(
        { error: 'You have already applied for this job' },
        { status: 400 }
      );
    }

    // Get user data
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    const userData = userDoc.data();

    const applicationData = {
      jobId,
      userId: decoded.uid,
      userEmail: decoded.email || userData?.email,
      userName: userData?.name || decoded.name || 'Unknown',
      coverLetter: coverLetter || '',
      resumeUrl: resumeUrl || '',
      answers: answers || {},
      status: 'pending',
      appliedAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection('jobApplications').add(applicationData);

    return NextResponse.json({
      success: true,
      application: {
        id: docRef.id,
        ...applicationData,
      },
    });
  } catch (error: any) {
    console.error('Error creating application:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit application' },
      { status: 500 }
    );
  }
}

