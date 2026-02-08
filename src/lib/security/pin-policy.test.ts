import { describe, expect, it } from 'vitest';
import { isValidPinFormat, isWeakPin } from './pin-policy';

describe('pin-policy', () => {
  it('validates 4-digit numeric PINs', () => {
    expect(isValidPinFormat('1234')).toBe(true);
    expect(isValidPinFormat('0000')).toBe(true);
    expect(isValidPinFormat('123')).toBe(false);
    expect(isValidPinFormat('12345')).toBe(false);
    expect(isValidPinFormat('12a4')).toBe(false);
  });

  it('flags weak PINs', () => {
    expect(isWeakPin('1234')).toBe(true);
    expect(isWeakPin('0000')).toBe(true);
    expect(isWeakPin('2468')).toBe(true);
    expect(isWeakPin('1357')).toBe(true);
    expect(isWeakPin('9876')).toBe(false);
  });
});

