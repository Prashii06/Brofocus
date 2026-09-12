// BroFocus Backend - Crypto Helpers
import crypto from 'crypto';

// ─── Refresh token hashing ───────────────────────────────────────────────────
// We only ever store a hash of the refresh token, never the raw value, so a DB
// leak alone can't be used to forge sessions.

export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

// ─── AES-256-GCM for third-party integration tokens (Gmail/Calendar/etc) ────
// ENCRYPTION_KEY must be a 32-byte value. Generate one with:
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY is not set in the environment');
  }
  // Accept either a 64-char hex string or a raw 32-char string.
  const buf = /^[0-9a-fA-F]{64}$/.test(key) ? Buffer.from(key, 'hex') : Buffer.from(key, 'utf8');
  if (buf.length !== 32) {
    throw new Error('ENCRYPTION_KEY must resolve to exactly 32 bytes');
  }
  return buf;
}

export function encrypt(plainText: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Store iv + authTag + ciphertext together, colon-delimited, all hex.
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(payload: string): string {
  const key = getEncryptionKey();
  const [ivHex, authTagHex, dataHex] = payload.split(':');
  if (!ivHex || !authTagHex || !dataHex) {
    throw new Error('Malformed encrypted payload');
  }
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}