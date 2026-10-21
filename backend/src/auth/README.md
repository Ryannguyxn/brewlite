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
Password is preserved exactly and bcrypt-hashed with cost 12. Full name is
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

Per API Contract v2.0 and the API owner's decision, the password must be a
string with at least 8 characters. No maximum character or byte length and no
complexity rule are added. Passwords are not trimmed or normalized. The
standard bcrypt hash/compare behavior is used. Tests cover long ASCII and
multibyte passwords accepted by the endpoint.

## Verification performed

- Installed dependencies and tested bcrypt's actual native implementation.
- Validated the shared dev schema after the SCRUM-36 merge.
- Generated Prisma Client directly from backend/prisma/schema.prisma using the
  repository configuration and unchanged output path.
- Lint and build passed with that generated client.
- Unit/HTTP: 28 passed, including 8 new Register tests.
- E2E: 36 passed, including 24 new Register tests.
- E2E requests run through the real AppModule and Register DTO validation,
  use real bcrypt, and override PrismaService. They do not contact PostgreSQL.
- Register tests cover normalization, allowed fields, password verification,
  omitted full name, minimum-length/type validation, long passwords, duplicate-email conflicts,
  safe failures, Swagger schemas/statuses, and Product API regression.

Apply the shared migrations to your local PostgreSQL with npm run db:migrate,
then verify a real registration in Swagger. The automated tests here do not
claim that real PostgreSQL registration or migrations have been exercised.
