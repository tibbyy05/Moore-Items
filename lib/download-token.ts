import { createHmac } from 'crypto';

const getSecret = () =>
  process.env.DOWNLOAD_TOKEN_SECRET ||
  process.env.STRIPE_WEBHOOK_SECRET ||
  'mi-download-fallback-key';

/**
 * Generate a download token for a specific order item.
 * Token = HMAC-SHA256(orderId:itemId, secret) as hex.
 */
export function generateDownloadToken(orderId: string, itemId: string): string {
  return createHmac('sha256', getSecret())
    .update(`${orderId}:${itemId}`)
    .digest('hex');
}

/**
 * Verify a download token matches the expected orderId:itemId pair.
 */
export function verifyDownloadToken(
  orderId: string,
  itemId: string,
  token: string
): boolean {
  const expected = generateDownloadToken(orderId, itemId);
  // Constant-time comparison
  if (expected.length !== token.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return mismatch === 0;
}
