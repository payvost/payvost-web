/**
 * Notification Webhook Client
 * 
 * This replaces Firebase Functions for sending notifications.
 * Calls the Render notification service instead.
 */

const NOTIFICATION_SERVICE_URL =
  process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL ||
  process.env.NOTIFICATION_SERVICE_URL ||
  'https://payvost-notification-service-xrk6.onrender.com';

/**
 * Helper function to safely parse JSON response
 */
async function parseJsonResponse(response: Response): Promise<{ data: any; error?: string }> {
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error('Notification service returned non-JSON response:', {
      status: response.status,
      contentType,
      preview: text.substring(0, 200),
    });
    return {
      data: null,
      error: `Notification service returned ${contentType || 'unknown content type'} instead of JSON`,
    };
  }
  
  try {
    const data = await response.json();
    return { data };
  } catch (error: any) {
    return {
      data: null,
      error: `Failed to parse JSON response: ${error.message}`,
    };
  }
}

/**
 * Send login notification
 */
export async function sendLoginNotification(params: {
  email: string;
  name: string;
  deviceInfo?: string;
  location?: string;
  timestamp?: Date | string;
  ipAddress?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/notify/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        name: params.name,
        deviceInfo: params.deviceInfo || 'Unknown',
        location: params.location || 'Unknown',
        timestamp: params.timestamp || new Date(),
        ipAddress: params.ipAddress,
      }),
    });

    const { data, error: parseError } = await parseJsonResponse(response);
    if (parseError || !data) {
      return {
        success: false,
        error: parseError || 'Failed to parse response',
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Failed to send login notification',
      };
    }

    return {
      success: data.success || false,
      messageId: data.messageId,
    };
  } catch (error: any) {
    console.error('Error sending login notification:', error);
    return {
      success: false,
      error: error.message || 'Failed to send login notification',
    };
  }
}

/**
 * Send KYC status notification
 */
export async function sendKycNotification(params: {
  email: string;
  name: string;
  status: 'approved' | 'rejected';
  reason?: string;
  nextSteps?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/notify/kyc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        name: params.name,
        status: params.status,
        reason: params.reason,
        nextSteps: params.nextSteps,
      }),
    });

    const { data, error: parseError } = await parseJsonResponse(response);
    if (parseError || !data) {
      return {
        success: false,
        error: parseError || 'Failed to parse response',
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Failed to send KYC notification',
      };
    }

    return {
      success: data.success || false,
      messageId: data.messageId,
    };
  } catch (error: any) {
    console.error('Error sending KYC notification:', error);
    return {
      success: false,
      error: error.message || 'Failed to send KYC notification',
    };
  }
}

/**
 * Send business status notification
 */
export async function sendBusinessNotification(params: {
  email: string;
  name: string;
  status: 'approved' | 'rejected';
  businessName: string;
  reason?: string;
  nextSteps?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/notify/business`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        name: params.name,
        status: params.status,
        businessName: params.businessName,
        reason: params.reason,
        nextSteps: params.nextSteps,
      }),
    });

    const { data, error: parseError } = await parseJsonResponse(response);
    if (parseError || !data) {
      return {
        success: false,
        error: parseError || 'Failed to parse response',
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Failed to send business notification',
      };
    }

    return {
      success: data.success || false,
      messageId: data.messageId,
    };
  } catch (error: any) {
    console.error('Error sending business notification:', error);
    return {
      success: false,
      error: error.message || 'Failed to send business notification',
    };
  }
}

/**
 * Send transaction notification
 */
export async function sendTransactionNotification(params: {
  email: string;
  name: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed' | 'initiated';
  recipientName?: string;
  reason?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/notify/transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        name: params.name,
        transactionId: params.transactionId,
        amount: params.amount,
        currency: params.currency,
        status: params.status,
        recipientName: params.recipientName,
        reason: params.reason,
      }),
    });

    const { data, error: parseError } = await parseJsonResponse(response);
    if (parseError || !data) {
      return {
        success: false,
        error: parseError || 'Failed to parse response',
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Failed to send transaction notification',
      };
    }

    return {
      success: data.success || false,
      messageId: data.messageId,
    };
  } catch (error: any) {
    console.error('Error sending transaction notification:', error);
    return {
      success: false,
      error: error.message || 'Failed to send transaction notification',
    };
  }
}

/**
 * Send payment link notification
 */
export async function sendPaymentLinkNotification(params: {
  email: string;
  name: string;
  amount: number;
  currency: string;
  paymentLink: string;
  expiryDate?: Date | string;
  description?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/notify/payment-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        name: params.name,
        amount: params.amount,
        currency: params.currency,
        paymentLink: params.paymentLink,
        expiryDate: params.expiryDate,
        description: params.description,
      }),
    });

    const { data, error: parseError } = await parseJsonResponse(response);
    if (parseError || !data) {
      return {
        success: false,
        error: parseError || 'Failed to parse response',
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Failed to send payment link notification',
      };
    }

    return {
      success: data.success || false,
      messageId: data.messageId,
    };
  } catch (error: any) {
    console.error('Error sending payment link notification:', error);
    return {
      success: false,
      error: error.message || 'Failed to send payment link notification',
    };
  }
}

/**
 * Send invoice notification
 */
export async function sendInvoiceNotification(params: {
  email: string;
  name: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate: Date | string;
  businessName: string;
  downloadLink?: string;
  type: 'generated' | 'reminder' | 'paid';
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/notify/invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        name: params.name,
        invoiceNumber: params.invoiceNumber,
        amount: params.amount,
        currency: params.currency,
        dueDate: params.dueDate,
        businessName: params.businessName,
        downloadLink: params.downloadLink,
        type: params.type,
      }),
    });

    const { data, error: parseError } = await parseJsonResponse(response);
    if (parseError || !data) {
      return {
        success: false,
        error: parseError || 'Failed to parse response',
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Failed to send invoice notification',
      };
    }

    return {
      success: data.success || false,
      messageId: data.messageId,
    };
  } catch (error: any) {
    console.error('Error sending invoice notification:', error);
    return {
      success: false,
      error: error.message || 'Failed to send invoice notification',
    };
  }
}

