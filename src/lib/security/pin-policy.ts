// Shared PIN policy helpers (safe to import on client or server).

export const WEAK_PINS = [
  '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
  '1234', '4321', '0123', '3210',
  '1010', '2020', '3030', '4040', '5050', '6060', '7070', '8080', '9090',
  '1122', '2211', '1212', '2121',
  '0001', '1000', '1233', '3211',
  '2468', '1357', '9753', '8642',
] as const;

export function isValidPinFormat(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

export function isWeakPin(pin: string): boolean {
  if (!isValidPinFormat(pin)) return false;
  return (WEAK_PINS as readonly string[]).includes(pin);
}

