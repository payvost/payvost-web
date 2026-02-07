import { NextResponse } from 'next/server';

/**
 * Resolve the backend base URL used for gateway proxies.
 */
export function getBackendBaseUrl(): string {
  const raw = process.env.BACKEND_URL || 'http://localhost:3001';
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

/**
 * Build a full backend URL using the configured base path.
 */
export function buildBackendUrl(path: string): string {
  const base = getBackendBaseUrl();
  if (!path.startsWith('/')) {
    return `${base}/${path}`;
  }
  return `${base}${path}`;
}

/**
 * Convert a fetch response from the backend into a Next.js response while
 * preserving status codes and response bodies. Defaults to JSON when possible.
 */
export async function backendResponseToNext(response: Response): Promise<NextResponse> {
  const contentType = response.headers.get('content-type') || '';
  const cacheControl = response.headers.get('cache-control') || undefined;
  const apiVersion = response.headers.get('api-version') || undefined;
  const text = await response.text();

  if (!text) {
    return new NextResponse(null, {
      status: response.status,
      headers: {
        ...(cacheControl ? { 'cache-control': cacheControl } : {}),
        ...(apiVersion ? { 'api-version': apiVersion } : {}),
      },
    });
  }

  if (contentType.includes('application/json')) {
    try {
      const json = JSON.parse(text);
      return NextResponse.json(json, {
        status: response.status,
        headers: {
          ...(cacheControl ? { 'cache-control': cacheControl } : {}),
          ...(apiVersion ? { 'api-version': apiVersion } : {}),
        },
      });
    } catch {
      // Fall through to return raw text when JSON parsing fails
    }
  }

  return new NextResponse(text, {
    status: response.status,
    headers: {
      'content-type': contentType || 'text/plain',
      ...(cacheControl ? { 'cache-control': cacheControl } : {}),
      ...(apiVersion ? { 'api-version': apiVersion } : {}),
    },
  });
}
