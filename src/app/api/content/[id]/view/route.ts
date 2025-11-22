import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/content/:id/view
 * Increment view count for content (public endpoint, no auth required)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // Call backend to increment view count
    const response = await fetch(`${API_BASE_URL}/api/content/${id}/view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to increment view count');
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error tracking view:', error);
    // Don't fail the request if view tracking fails
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

