type CachedValue = { value: string; expiresAt: number };

const cache = new Map<string, CachedValue>();
const TTL_MS = 6 * 60 * 60 * 1000; // 6h
const MAX_ENTRIES = 5000;

function now() {
  return Date.now();
}

function isPrivateOrLocalIp(ip: string): boolean {
  const s = (ip || '').trim();
  if (!s) return true;
  if (s === 'unknown') return true;
  if (s === '127.0.0.1' || s === '::1') return true;
  if (s.startsWith('10.')) return true;
  if (s.startsWith('192.168.')) return true;
  // 172.16.0.0 - 172.31.255.255
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(s)) return true;
  // RFC6598 CGNAT 100.64.0.0/10
  if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(s)) return true;
  return false;
}

function pruneIfNeeded() {
  if (cache.size <= MAX_ENTRIES) return;
  const t = now();
  for (const [k, v] of cache.entries()) {
    if (v.expiresAt <= t) cache.delete(k);
  }
  // If still too big, delete oldest-ish by iterating insertion order.
  while (cache.size > MAX_ENTRIES) {
    const firstKey = cache.keys().next().value as string | undefined;
    if (!firstKey) break;
    cache.delete(firstKey);
  }
}

async function fetchJson(url: string, timeoutMs: number): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'accept': 'application/json' } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function formatLocation(parts: { city?: string; region?: string; country?: string }): string | null {
  const city = (parts.city || '').trim();
  const region = (parts.region || '').trim();
  const country = (parts.country || '').trim();
  const bits = [city, region, country].filter(Boolean);
  if (bits.length === 0) return null;
  return bits.join(', ');
}

/**
 * Best-effort IP geolocation (no API key) with caching.
 * Uses ipwho.is, which returns city/region/country for public IPs.
 */
export async function resolveLocationFromIp(ip: string): Promise<string | null> {
  const key = (ip || '').trim();
  if (!key || isPrivateOrLocalIp(key)) return null;

  const t = now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > t) return cached.value;

  // ipwho.is: { success, city, region, country, ... }
  const data = await fetchJson(`https://ipwho.is/${encodeURIComponent(key)}`, 1500);
  if (!data || data.success === false) return null;

  const value =
    formatLocation({ city: data.city, region: data.region, country: data.country }) ||
    formatLocation({ region: data.region, country: data.country }) ||
    (typeof data.country === 'string' ? data.country : null);

  if (!value) return null;

  cache.set(key, { value, expiresAt: t + TTL_MS });
  pruneIfNeeded();
  return value;
}

