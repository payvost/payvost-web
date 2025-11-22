import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { verifySessionCookie, isHrAdmin } from '@/lib/auth-helpers';
import { cookies } from 'next/headers';

// GET /api/hr/jobs - Get all jobs (public for careers page, filtered for HR)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'all';
    const isPublic = !searchParams.get('hr'); // If hr param is not present, it's public

    const jobsRef = db.collection('jobs');
    let query: FirebaseFirestore.Query = jobsRef;

    if (isPublic) {
      // Public access - only show active jobs
      query = query.where('status', '==', 'active');
    } else {
      // HR access - check authentication
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

      if (status !== 'all') {
        query = query.where('status', '==', status);
      }
    }

    const snapshot = await query.orderBy('postedDate', 'desc').get();
    const jobs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ jobs });
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

// POST /api/hr/jobs - Create a new job (HR only)
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      title,
      department,
      location,
      type,
      salary,
      description,
      requirements,
      responsibilities,
      status = 'active',
    } = body;

    if (!title || !department || !location || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: title, department, location, type' },
        { status: 400 }
      );
    }

    const jobData = {
      title,
      department,
      location,
      type,
      salary: salary || null,
      description: description || '',
      requirements: requirements || [],
      responsibilities: responsibilities || [],
      status,
      postedDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: decoded.uid,
    };

    const docRef = await db.collection('jobs').add(jobData);

    return NextResponse.json({
      success: true,
      job: {
        id: docRef.id,
        ...jobData,
      },
    });
  } catch (error: any) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create job' },
      { status: 500 }
    );
  }
}

