import { describe, expect, it, beforeEach } from 'vitest';
import { buildBackendUrl, getBackendBaseUrl } from './backend';

describe('lib/api/backend', () => {
  beforeEach(() => {
    delete process.env.BACKEND_URL;
  });

  it('defaults to localhost backend', () => {
    expect(getBackendBaseUrl()).toBe('http://localhost:3001');
  });

  it('strips trailing slash from BACKEND_URL', () => {
    process.env.BACKEND_URL = 'https://backend.example.com/';
    expect(getBackendBaseUrl()).toBe('https://backend.example.com');
  });

  it('buildBackendUrl joins base and path (leading slash)', () => {
    process.env.BACKEND_URL = 'https://backend.example.com';
    expect(buildBackendUrl('/api/currency/supported')).toBe('https://backend.example.com/api/currency/supported');
  });

  it('buildBackendUrl joins base and path (no leading slash)', () => {
    process.env.BACKEND_URL = 'https://backend.example.com/';
    expect(buildBackendUrl('health')).toBe('https://backend.example.com/health');
  });
});

