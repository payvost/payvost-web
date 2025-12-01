import { NextRequest, NextResponse } from 'next/server';
import { rapydService } from '@/services/rapydService';
import { db } from '@/lib/firebase-admin';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { country = 'US', customerEmail, customerName } = body;

    // Fetch payment link from Firestore
    const linkDoc = await db.collection('paymentRequests').doc(id).get();
    if (!linkDoc.exists) {
      return NextResponse.json(
        { ok: false, error: 'Payment link not found' },
        { status: 404 }
      );
    }

    const linkData = linkDoc.data();
    
    // Check if link is active
    if (linkData?.status !== 'Active') {
      return NextResponse.json(
        { ok: false, error: 'Payment link is not active' },
        { status: 400 }
      );
    }

    // Check if one-time link has already been used
    if (linkData?.linkType === 'one-time' && linkData?.used) {
      return NextResponse.json(
        { ok: false, error: 'This payment link has already been used' },
        { status: 400 }
      );
    }

    // Create or get customer
    let customerId = linkData?.rapydCustomerId;
    if (!customerId && customerEmail) {
      try {
        const customer = await rapydService.createCustomer({
          name: customerName || customerEmail,
          email: customerEmail,
          metadata: {
            paymentLinkId: id,
          },
        });
        customerId = customer.id;
        
        // Save customer ID to payment link
        await db.collection('paymentRequests').doc(id).update({
          rapydCustomerId: customerId,
        });
      } catch (error) {
        console.error('Error creating customer:', error);
        // Continue without customer if creation fails
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.payvost.com';

    // Create Rapyd checkout
    const checkout = await rapydService.createCheckout({
      amount: linkData?.numericAmount || parseFloat(linkData?.amount?.replace(/[^\d.]/g, '') || '0'),
      currency: linkData?.currency || 'USD',
      country,
      description: linkData?.description || `Payment for ${linkData?.amount}`,
      merchant_reference_id: id,
      ...(customerId && { customer: customerId }),
      metadata: {
        paymentLinkId: id,
        userId: linkData?.userId,
        linkType: linkData?.linkType || 'one-time',
      },
      complete_payment_url: `${baseUrl}/pay/${id}?status=success`,
      error_payment_url: `${baseUrl}/pay/${id}?status=error`,
      cancel_payment_url: `${baseUrl}/pay/${id}?status=cancelled`,
      complete_checkout_url: `${baseUrl}/pay/${id}?status=success`,
      error_checkout_url: `${baseUrl}/pay/${id}?status=error`,
      cancel_checkout_url: `${baseUrl}/pay/${id}?status=cancelled`,
    });

    // Save checkout ID to payment link
    await db.collection('paymentRequests').doc(id).update({
      rapydCheckoutId: checkout.id,
      lastCheckoutCreatedAt: new Date(),
    });

    return NextResponse.json({
      ok: true,
      checkout,
      checkoutUrl: checkout.checkout_url,
    });
  } catch (error: any) {
    console.error('Checkout creation error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error.message || 'Failed to create checkout',
      },
      { status: 500 }
    );
  }
}

