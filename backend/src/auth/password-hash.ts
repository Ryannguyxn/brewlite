import * as argon2 from 'argon2';

// OWASP Argon2id baseline: 19 MiB, two passes and one lane.
// Salt is generated securely by node-argon2 for every hash.
const HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
} satisfies argon2.HashOptions;

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, HASH_OPTIONS);
}

// Shared with Login (SCRUM-39). Passwords are never trimmed or normalized.
export async function verifyPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  if (!hash.startsWith('$argon2id$')) return false;
  return argon2.verify(hash, password);
}
