import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db, auth } from '@/lib/firebase-admin';
import { verifySessionCookie, isAdmin } from '@/lib/auth-helpers';

interface AuditLog {
  id: string;
  uid: string;
  userName?: string;
  userType?: string;
  action: string;
  timestamp: Date;
  ip: string;
  metadata?: Record<string, any>;
}

export async function GET(request: NextRequest) {
  try {
    // Authorization: verify session and admin role
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifySessionCookie(sessionCookie);
    const admin = await isAdmin(decoded.uid);
    
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const userType = searchParams.get('userType') || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    console.log('🔍 Fetching audit logs with filters:', {
      search,
      userType,
      startDate,
      endDate,
      page,
      limit,
    });

    // Build query
    // Note: We fetch all logs and filter client-side to avoid needing composite indexes
    // For better performance with large datasets, consider adding Firestore composite indexes
    let query: FirebaseFirestore.Query = db.collection('adminAuditLog');

    // Apply date range filter if provided
    // If both start and end dates are provided, we need a composite index
    // For now, we'll fetch more and filter client-side if needed
    try {
      if (startDate && endDate) {
        // Try to use range query if possible
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query = query.where('timestamp', '>=', start)
                     .where('timestamp', '<=', end)
                     .orderBy('timestamp', 'desc');
      } else if (startDate) {
        const start = new Date(startDate);
        query = query.where('timestamp', '>=', start).orderBy('timestamp', 'desc');
      } else if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query = query.where('timestamp', '<=', end).orderBy('timestamp', 'desc');
      } else {
        // No date filter, just order by timestamp
        query = query.orderBy('timestamp', 'desc');
      }
    } catch (queryError: any) {
      // If query fails (e.g., missing composite index), fall back to fetching all and filtering
      console.warn('Query with filters failed, falling back to fetching all logs:', queryError);
      query = db.collection('adminAuditLog').orderBy('timestamp', 'desc');
    }

    // Fetch logs (limit to prevent memory issues)
    const logsSnapshot = await query.limit(1000).get(); // Fetch more than needed for filtering

    // Process and filter logs
    let logs: AuditLog[] = [];
    const userIds = new Set<string>();

    for (const doc of logsSnapshot.docs) {
      const data = doc.data();
      const uid = data.uid || '';
      userIds.add(uid);

      // Get user info from metadata or document fields
      let userName = data.metadata?.userName || data.userName || '';
      let logUserType = data.metadata?.userType || data.userType || '';

      // Apply user type filter
      if (userType !== 'all') {
        const isAdminUser = logUserType === 'admin' || logUserType === 'Admin' || 
                           logUserType === 'super_admin' || logUserType === 'Super Admin';
        const isCustomerUser = logUserType === 'customer' || logUserType === 'Customer' ||
                               (!isAdminUser && logUserType !== '');
        
        if (userType === 'admin' && !isAdminUser) continue;
        if (userType === 'customer' && !isCustomerUser) continue;
      }

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const actionLower = (data.action || '').toLowerCase();
        const ipLower = (data.ip || '').toLowerCase();
        const userNameLower = userName.toLowerCase();
        
        if (
          !actionLower.includes(searchLower) &&
          !ipLower.includes(searchLower) &&
          !userNameLower.includes(searchLower)
        ) {
          continue;
        }
      }

      logs.push({
        id: doc.id,
        uid,
        userName,
        userType: logUserType,
        action: data.action || 'Unknown action',
        timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
        ip: data.ip || data.metadata?.ip || 'unknown',
        metadata: data.metadata || {},
      });
    }

    // Fetch user names for logs that don't have them
    const missingUserIds = Array.from(userIds).filter(id => 
      !logs.some(log => log.uid === id && log.userName)
    );

    if (missingUserIds.length > 0) {
      const userDocs = await Promise.all(
        missingUserIds.map(id => db.collection('users').doc(id).get())
      );

      const userMap = new Map<string, { name: string; role: string }>();
      for (const userDoc of userDocs) {
        if (userDoc.exists) {
          const userData = userDoc.data();
          userMap.set(userDoc.id, {
            name: userData?.fullName || userData?.displayName || userData?.name || userData?.email || 'Unknown',
            role: userData?.role || userData?.userType || 'Customer',
          });
        }
      }

      // Update logs with user info
      logs = logs.map(log => {
        if (!log.userName && userMap.has(log.uid)) {
          const userInfo = userMap.get(log.uid)!;
          return {
            ...log,
            userName: userInfo.name,
            userType: userInfo.role === 'admin' || userInfo.role === 'super_admin' ? 'Admin' : 'Customer',
          };
        }
        return log;
      });
    }

    // Apply pagination
    const total = logs.length;
    const paginatedLogs = logs.slice(offset, offset + limit);

    return NextResponse.json({
      logs: paginatedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to fetch audit logs',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

