import { afterEach, describe, expect, it, vi } from 'vitest';
import { getJwtSecret } from './jwt.config.js';

describe('JWT configuration', () => {
  afterEach(() => vi.unstubAllEnvs());

  it.each([undefined, '', ' '.repeat(40), 'short-secret'])(
    'refuses a missing or short secret',
    (secret) => {
      vi.stubEnv('JWT_SECRET', secret);
      expect(() => getJwtSecret()).toThrow(
        'JWT_SECRET must be configured with at least 32 bytes.',
      );
    },
  );

  it('uses the configured secret without modifying it', () => {
    const secret = ' a-configured-secret-of-at-least-32-bytes ';
    vi.stubEnv('JWT_SECRET', secret);
    expect(getJwtSecret()).toBe(secret);
  });
});
