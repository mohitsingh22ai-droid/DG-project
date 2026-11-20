import crypto from "crypto";

/*
 * Signed, short-lived download tokens for production files (PRD § 11, § 13).
 * A token is "<hmac>.<expiry>": the HMAC binds it to one order number and expiry,
 * so it cannot be reused for another order or after it expires.
 */

function signingSecret(): string {
  const secret = process.env.SIGNED_URL_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("SIGNED_URL_SECRET (or SUPABASE_SERVICE_ROLE_KEY) must be set to sign download links.");
  return crypto.createHash("sha256").update(`download-links:${secret}`).digest("hex");
}

/** Short-lived (default 60 s) HMAC token for production file downloads. */
export function generateSignedDownloadToken(orderNumber: string, expiresInSeconds: number = 60): { token: string; expires: number } {
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const hmac = crypto.createHmac("sha256", signingSecret()).update(`${orderNumber}:${expires}`).digest("hex");
  return { token: `${hmac}.${expires}`, expires };
}

export function verifySignedDownloadToken(orderNumber: string, token: string): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2 || !/^\d+$/.test(parts[1])) return false;

  const expires = parseInt(parts[1], 10);
  if (Math.floor(Date.now() / 1000) > expires) return false;

  const expected = crypto.createHmac("sha256", signingSecret()).update(`${orderNumber}:${expires}`).digest("hex");
  const a = Buffer.from(parts[0]);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

