/**
 * Chat Event Tracker
 * Tracks customer metadata and events for analytics
 */

export interface ChatEventMetadata {
  userAgent?: string;
  language?: string;
  screenSize?: string;
  pageUrl?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  device?: string;
  browser?: string;
  os?: string;
  timestamp?: string;
}

export interface CustomerMetadata {
  device: string;
  browser: string;
  os: string;
  language: string;
  screenSize: string;
  timezone: string;
  pagesVisited: Array<{ url: string; timestamp: string }>;
  referrer?: string;
  utmParams?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
}

/**
 * Get browser information
 */
function getBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Unknown';
}

/**
 * Get OS information
 */
function getOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS')) return 'iOS';
  return 'Unknown';
}

/**
 * Get device type
 */
function getDevice(): string {
  const ua = navigator.userAgent;
  if (/Mobile|Android|iPhone|iPad/.test(ua)) {
    return 'Mobile';
  }
  if (/Tablet|iPad/.test(ua)) {
    return 'Tablet';
  }
  return 'Desktop';
}

/**
 * Get UTM parameters from URL
 */
function getUTMParams(): { source?: string; medium?: string; campaign?: string } {
  if (typeof window === 'undefined') return {};
  
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get('utm_source') || undefined,
    medium: params.get('utm_medium') || undefined,
    campaign: params.get('utm_campaign') || undefined,
  };
}

/**
 * Collect customer metadata
 */
export function collectCustomerMetadata(): CustomerMetadata {
  if (typeof window === 'undefined') {
    return {
      device: 'Unknown',
      browser: 'Unknown',
      os: 'Unknown',
      language: 'en',
      screenSize: '0x0',
      timezone: 'UTC',
      pagesVisited: [],
    };
  }

  return {
    device: getDevice(),
    browser: getBrowser(),
    os: getOS(),
    language: navigator.language || 'en',
    screenSize: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    pagesVisited: [
      {
        url: window.location.href,
        timestamp: new Date().toISOString(),
      },
    ],
    referrer: document.referrer || undefined,
    utmParams: getUTMParams(),
  };
}

/**
 * Track chat event
 */
export async function trackChatEvent(
  sessionId: string,
  eventType: string,
  metadata?: Partial<ChatEventMetadata>
): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const eventMetadata: ChatEventMetadata = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      pageUrl: window.location.href,
      referrer: document.referrer,
      device: getDevice(),
      browser: getBrowser(),
      os: getOS(),
      timestamp: new Date().toISOString(),
      ...getUTMParams(),
      ...metadata,
    };

    await fetch('/api/support/chat/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        eventType,
        metadata: eventMetadata,
      }),
    });
  } catch (error) {
    console.error('Failed to track chat event:', error);
    // Don't throw - tracking failures shouldn't break the app
  }
}

/**
 * Track page visit
 */
export function trackPageVisit(sessionId: string | null): void {
  if (!sessionId || typeof window === 'undefined') return;

  trackChatEvent(sessionId, 'PAGE_VISIT', {
    pageUrl: window.location.href,
  });
}

/**
 * Track widget opened
 */
export function trackWidgetOpened(sessionId: string | null): void {
  if (!sessionId) return;

  trackChatEvent(sessionId, 'WIDGET_OPENED');
}

/**
 * Track message sent
 */
export function trackMessageSent(sessionId: string | null, messageLength: number): void {
  if (!sessionId) return;

  trackChatEvent(sessionId, 'MESSAGE_SENT', {
    messageLength: messageLength.toString(),
  } as any);
}

/**
 * Initialize tracking for a session
 */
export function initializeTracking(sessionId: string | null): void {
  if (!sessionId || typeof window === 'undefined') return;

  // Track initial page visit
  trackPageVisit(sessionId);

  // Track page changes (SPA navigation)
  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      trackPageVisit(sessionId);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    observer.disconnect();
  });
}

