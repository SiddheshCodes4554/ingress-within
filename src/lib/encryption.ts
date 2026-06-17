import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// Obtain the key from environment. Fall back to a default key if missing,
// but in production, we expect ENCRYPTION_MASTER_KEY to be set.
const getMasterKey = (): Buffer | null => {
  const hexKey = process.env.ENCRYPTION_MASTER_KEY;
  if (!hexKey) {
    return null;
  }
  try {
    const key = Buffer.from(hexKey, 'hex');
    if (key.length !== 32) {
      console.warn(`[Encryption] ENCRYPTION_MASTER_KEY must be exactly 32 bytes (64 hex characters). Got ${key.length} bytes.`);
      return null;
    }
    return key;
  } catch (err) {
    console.error('[Encryption] Invalid ENCRYPTION_MASTER_KEY hex format:', err);
    return null;
  }
};

export function encrypt(plaintext: string): { encrypted: string | null; iv: string | null } {
  if (!plaintext || plaintext.trim() === '') {
    return { encrypted: null, iv: null };
  }
  const key = getMasterKey();
  if (!key) {
    // Graceful fallback to plaintext if no key is configured
    return { encrypted: plaintext, iv: null };
  }
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return { encrypted: `${encrypted}:${authTag}`, iv: iv.toString('hex') };
  } catch (err) {
    console.error('[Encryption] Encryption failed:', err);
    return { encrypted: plaintext, iv: null };
  }
}

export function decrypt(encryptedWithTag: string | null, ivHex: string | null): string | null {
  if (!encryptedWithTag) return null;
  if (!ivHex) {
    // If there is no IV, it's stored in plain text
    return encryptedWithTag;
  }
  const key = getMasterKey();
  if (!key) {
    // Fallback: if we cannot retrieve the master key, we return the raw string
    return encryptedWithTag;
  }
  try {
    const parts = encryptedWithTag.split(':');
    if (parts.length < 2) {
      // Not in the standard encrypted format (missing auth tag)
      return encryptedWithTag;
    }
    const [encrypted, authTag] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    let text = decipher.update(encrypted, 'hex', 'utf8');
    text += decipher.final('utf8');
    return text;
  } catch (err) {
    console.error('[Encryption] Decryption failed:', err);
    // Return the raw text as fallback in case it wasn't actually encrypted
    return encryptedWithTag;
  }
}
