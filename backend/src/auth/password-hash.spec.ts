import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password-hash.js';

describe('Argon2id password hashing', () => {
  it('encodes the configured work factors and fits the shared passwordHash column', async () => {
    const password = 'password';
    const hash = await hashPassword(password);
    expect(hash).toMatch(/^\$argon2id\$v=19\$/);
    expect(hash.split('$')[3].split(',').sort()).toEqual([
      'm=19456',
      'p=1',
      't=2',
    ]);
    expect(hash.length).toBeLessThanOrEqual(255);
    expect(await verifyPassword(hash, password)).toBe(true);
    expect(await verifyPassword(hash, 'wrong-password')).toBe(false);
  });

  it('generates a different random salt for each hash', async () => {
    const password = 'Password123';
    const first = await hashPassword(password);
    const second = await hashPassword(password);
    expect(first).not.toBe(second);
    expect(await verifyPassword(first, password)).toBe(true);
    expect(await verifyPassword(second, password)).toBe(true);
  });

  it.each(['a'.repeat(72), 'é'.repeat(36)])(
    'distinguishes passwords differing only after the first 72 UTF-8 bytes',
    async (prefix) => {
      expect(Buffer.byteLength(prefix, 'utf8')).toBe(72);
      const first = prefix + 'A';
      const second = prefix + 'B';
      const firstHash = await hashPassword(first);
      const secondHash = await hashPassword(second);
      expect(await verifyPassword(firstHash, first)).toBe(true);
      expect(await verifyPassword(secondHash, second)).toBe(true);
      expect(await verifyPassword(firstHash, second)).toBe(false);
      expect(await verifyPassword(secondHash, first)).toBe(false);
      expect(await verifyPassword(firstHash, prefix)).toBe(false);
    },
  );

  it('preserves spaces, case and Unicode normalization differences', async () => {
    const password = ' Pássword123 ';
    const hash = await hashPassword(password);
    expect(await verifyPassword(hash, password)).toBe(true);
    expect(await verifyPassword(hash, password.trim())).toBe(false);
    expect(await verifyPassword(hash, password.toLowerCase())).toBe(false);
    expect(await verifyPassword(hash, password.normalize('NFD'))).toBe(false);
  });

  it('refuses a non-Argon2id hash rather than treating it as a plaintext password', async () => {
    expect(await verifyPassword('old-or-unsupported-hash', 'Password123')).toBe(
      false,
    );
  });
});
