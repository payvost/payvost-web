import { createHmac } from 'crypto';

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export type RapydWebhookHeaders = {
  signature?: string;
  salt?: string;
  timestamp?: string;
  access_key?: string;
};

export function computeRapydWebhookSignature(params: {
  urlPath: string;
  salt: string;
  timestamp: string;
  accessKey: string;
  secretKey: string;
  body: string;
}) {
  // Rapyd docs: base64(hmac_sha256(url_path + salt + timestamp + access_key + secret_key + body)).
  const { urlPath, salt, timestamp, accessKey, secretKey, body } = params;
  const toSign = `${urlPath}${salt}${timestamp}${accessKey}${secretKey}${body}`;
  return createHmac('sha256', secretKey).update(toSign).digest('base64');
}

export function verifyRapydWebhookSignature(params: {
  urlPathCandidates: string[];
  headers: RapydWebhookHeaders;
  secretKey: string;
  maxAgeSeconds?: number;
  body: string;
}) {
  const maxAgeSeconds = params.maxAgeSeconds ?? 300;

  const signature = (params.headers.signature || '').trim();
  const salt = (params.headers.salt || '').trim();
  const timestamp = (params.headers.timestamp || '').trim();
  const accessKey = (params.headers.access_key || '').trim();

  if (!signature || !salt || !timestamp || !accessKey || !params.secretKey) {
    return { ok: false as const, error: 'Missing signature headers' };
  }

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return { ok: false as const, error: 'Invalid timestamp' };

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > maxAgeSeconds) return { ok: false as const, error: 'Webhook timestamp too old' };

  const candidates = params.urlPathCandidates.filter(Boolean);
  if (candidates.length === 0) return { ok: false as const, error: 'No urlPath candidates' };

  for (const urlPath of candidates) {
    const expected = computeRapydWebhookSignature({
      urlPath,
      salt,
      timestamp,
      accessKey,
      secretKey: params.secretKey,
      body: params.body,
    });
    if (constantTimeEqual(signature, expected)) return { ok: true as const, urlPath };
  }

  return { ok: false as const, error: 'Invalid signature' };
}

