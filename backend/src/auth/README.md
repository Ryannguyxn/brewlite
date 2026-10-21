# SCRUM-38 — Register API

Endpoint public: POST /auth/register. Auth tag on /api-docs.
This change implements registration only. Login/JWT/Guard belong to SCRUM-39.

## Dependency on the shared schema

The branch is based on dev at aac7f14, which includes SCRUM-36 via PR #54.
The shared User schema and migrations are available under backend/prisma.
Do not duplicate or move Prisma files into src/prisma, and do not commit
any generated client files.

Required User model fields: id (UUID), email (unique), passwordHash,
fullName (nullable), loyaltyPoints (default 0). This commit does not change
schema.prisma, migrations, seed, Prisma configuration or PrismaService.

Run from backend after updating the project from dev:

```bash
npm ci
npm run db:validate
npm run db:generate
npm run db:migrate
npm run lint
npm run build
npm test
npm run test:e2e
npm run start:dev
```

Use DATABASE_URL in backend/.env for your local PostgreSQL. Do not commit .env.
A User-aware generated client is required; generating from the old Product-only
schema will correctly report that PrismaService.user does not exist.

## Request and response

```json
{
  "email": " Customer@Example.COM ",
  "password": "Password123",
  "fullName": "Nguyen Van A"
}
```

201 response:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "customer@example.com",
  "fullName": "Nguyen Van A"
}
```

Email is trimmed/lowercased and validated (maximum 255 characters).
Password is preserved exactly and hashed with Argon2id. Full name is
optional and limited to 255 characters. Omission returns fullName: null,
matching the shared nullable User model.

Unknown fields are stripped by the endpoint's ValidationPipe. Database writes
also explicitly enumerate email, passwordHash and fullName. A client-provided
id, role, loyaltyPoints, passwordHash or token is never used. Loyalty points
use the database default. Registration does not issue a JWT.

400 VALIDATION_ERROR: message is an array of validation messages.
409 EMAIL_ALREADY_EXISTS: database P2002 unique conflict, including concurrent
registration attempts. There is no check-then-insert race.
500: standard sanitized server error. Logs contain no request/password/hash or
raw database errors. Products retain their existing Sprint 1 error contract.

## Password validation

Per the team's PR #58 review decision, the password must be a
string with at least 8 characters. No maximum character or byte length and no
complexity rule are added. Passwords are not trimmed or normalized. The
entire password is hashed, including all bytes beyond byte 72. There is no
72-byte validation rule and no requirement for uppercase, digits or symbols.
The existing HTTP JSON body-size limit remains in effect; this change adds no
new password-specific maximum.

The shared password-hash.ts utility uses node-argon2 with explicit Argon2id
parameters: memoryCost=19456 KiB (19 MiB), timeCost=2, parallelism=1,
hashLength=32 bytes, and an automatically generated random salt per hash.
These parameters match an OWASP recommended minimum configuration:
https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
Each active hash operation uses about 19 MiB for Argon2 memory; concurrency
and final latency should be measured on the deployment backend before tuning.
The encoded hash stores the salt and work factors and fits the existing
passwordHash VARCHAR(255). No Prisma schema change or migration is needed.

SCRUM-39 must call verifyPassword(storedHash, submittedPassword), which uses
argon2.verify. Bcrypt hashes from earlier local test registrations are not
converted automatically: their original passwords cannot be recovered from
the hashes. Use a newly registered test account or a proper password reset
for those accounts; do not delete shared user data. There is no bcrypt fallback.

API Contract v2.0 still explicitly specifies bcrypt for Register and Login.
The team needs to update those two statements to Argon2id hash/verify. Request
and response schemas, statuses, the 8-character minimum and normalization
rules are unchanged. The reviewer already approved this algorithm change.

## Verification performed

- Replaced bcrypt/@types-bcrypt with argon2, which includes TypeScript types.
- Tested the actual native Argon2id hash and verify implementation.
- Validated the shared dev schema after the SCRUM-36 merge.
- Generated Prisma Client directly from backend/prisma/schema.prisma using the
  repository configuration and unchanged output path.
- Lint and build passed with that generated client.
- Unit/HTTP: 34 passed.
- E2E: 41 passed.
- E2E requests run through the real AppModule and Register DTO validation,
  use real Argon2id, and override PrismaService. They do not contact PostgreSQL.
- Register tests cover normalization, allowed fields, password verification,
  omitted full name, 7/8-character boundaries, passwords of more than 72 bytes,
  ASCII/Unicode suffixes beyond byte 72, unique random salts, stored work factors,
  duplicate-email conflicts,
  safe failures, Swagger schemas/statuses, and Product API regression.

Apply the shared migrations to your local PostgreSQL with npm run db:migrate,
then verify a real registration in Swagger. The automated tests here do not
claim that real PostgreSQL registration or migrations have been exercised.
