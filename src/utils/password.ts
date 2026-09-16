// Simple bcrypt-like simulation (NOT real bcrypt).
// Purpose: avoid storing plaintext in localStorage during demo/dev.
// This is intentionally lightweight and synchronous — replace with real bcrypt on backend.

function simpleHash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) + input.charCodeAt(i); /* h * 33 + c */
    h = h & 0xffffffff;
  }
  return (h >>> 0).toString(36);
}

export function generateSalt(len = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function hashPassword(password: string, salt?: string): string {
  const s = salt || generateSalt(8);
  // do a few simple iterations to simulate work
  let out = s + password;
  for (let i = 0; i < 1000; i++) {
    out = simpleHash(out) + out;
  }
  const digest = simpleHash(out);
  return `bcryptsim$${s}$${digest}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored || !stored.startsWith('bcryptsim$')) return false;
  const parts = stored.split('$');
  if (parts.length !== 3) return false;
  const salt = parts[1];
  const hashed = hashPassword(password, salt);
  return hashed === stored;
}
