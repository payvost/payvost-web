// Minimal Web Crypto helpers for PIN hashing
// Uses SHA-256 with a random 16-byte salt. Stores base64 strings.

export function generateSalt(bytes = 16): string {
  const salt = new Uint8Array(bytes);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(salt);
  } else {
    // Fallback for non-browser env; not expected client-side
    for (let i = 0; i < bytes; i++) salt[i] = Math.floor(Math.random() * 256);
  }
  return bufferToBase64(salt);
}

export async function sha256Base64(input: Uint8Array | string): Promise<string> {
  const data = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  // Ensure BufferSource compatibility across TS libs by passing an ArrayBuffer slice
  const ab = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as unknown as ArrayBuffer;
  const digest = await crypto.subtle.digest('SHA-256', ab);
  return bufferToBase64(new Uint8Array(digest));
}

export function bufferToBase64(buf: Uint8Array): string {
  if (typeof window === 'undefined') {
    return Buffer.from(buf).toString('base64');
  }
  let binary = '';
  const bytes = buf;
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBuffer(b64: string): Uint8Array {
  if (typeof window === 'undefined') {
    return new Uint8Array(Buffer.from(b64, 'base64'));
  }
  const binary_string = atob(b64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

// Hash a PIN with a base64 salt as SHA-256(salt || pin)
export async function hashPinWithSalt(pin: string, saltB64: string): Promise<string> {
  const salt = base64ToBuffer(saltB64);
  const pinBytes = new TextEncoder().encode(pin);
  const data = new Uint8Array(salt.length + pinBytes.length);
  data.set(salt, 0);
  data.set(pinBytes, salt.length);
  return sha256Base64(data);
}
