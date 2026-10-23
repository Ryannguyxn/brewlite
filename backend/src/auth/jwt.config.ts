import 'dotenv/config';

export const ACCESS_TOKEN_TTL_SECONDS = 3600;

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret?.trim() || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 bytes.');
  }
  return secret;
}
