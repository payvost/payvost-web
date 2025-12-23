import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url') || searchParams.get('data'); // Support both 'url' and 'data' for compatibility
    
    if (!url) {
      return NextResponse.json({ error: 'Missing url or data parameter' }, { status: 400 });
    }

    // Generate QR code as PNG buffer
    const qrCodeBuffer = await QRCode.toBuffer(url, {
      type: 'png',
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return new NextResponse(new Uint8Array(Buffer.isBuffer(qrCodeBuffer) ? qrCodeBuffer : qrCodeBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline; filename="qr-code.png"',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('[QR Code] Generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate QR code',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

