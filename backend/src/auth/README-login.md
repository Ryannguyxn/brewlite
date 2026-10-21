# SCRUM-39 — Login and JWT

Public endpoint: `POST /auth/login`, API Contract v2 section 7.
This branch builds on SCRUM-38 at e8dff67. If Register is not merged yet,
review this PR against SCRUM-38 first, then target dev after Register merges.
Do not apply this patch on a Product-only branch.

## Database dependency

dev at aac7f14 already contains the User schema and migrations from SCRUM-36.
Login needs User.id, unique email and passwordHash. No additional migration is
required by SCRUM-39. SCRUM-37 at 56d7791 adds a SQL verification script only;
it does not introduce a new runtime schema dependency for Login.
Prisma structure, schema, migrations, seed, config and PrismaService are unchanged.

## Local setup

Keep backend/.env and its existing DATABASE_URL/PORT. Generate a secret locally:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Add the output to backend/.env as `JWT_SECRET=<generated value>`.
Do not paste the output into the repository, PR, logs or chat.
The application refuses to start if the secret is missing, whitespace-only or
shorter than 32 bytes. There is no development fallback secret in application code.
Use one stable secret across backend instances; changing it invalidates old tokens.

From backend:

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

Use the port you already configured. For a temporary PowerShell port override:

```powershell
$env:PORT = "3002"
npm run start:dev
```

Swagger is at `/api-docs`. Register a user, then call POST /auth/login:

```json
{ "email": "customer@example.com", "password": "Password123" }
```

Success: HTTP 200, `{ "accessToken": "<signed JWT>", "tokenType": "Bearer", "expiresIn": 3600 }`.
JWT uses HS256 and contains only sub (database User UUID), iat and exp. Its actual
expiration matches the returned 3600 seconds. No password/hash, role, email,
loyalty points, secret or refresh token is returned in the response or JWT.
Email is trimmed/lowercased. Password is required, nonempty and preserved as
submitted, without a registration minimum/max check. Login uses Argon2id verifyPassword
with the stored hash. Unknown email still performs Argon2id verification using a
dummy hash, and returns the same response as an incorrect password.

Invalid input: 400 VALIDATION_ERROR. Unknown email/wrong password:
401 INVALID_CREDENTIALS (`Invalid email or password`). Unexpected failures:
sanitized 500 Internal Server Error. No credentials or raw errors are logged.

Register's agreed no-maximum policy is unchanged. Argon2id hashes and verifies
the complete password, including bytes after byte 72. Passwords sharing only
the first 72 bytes do not verify interchangeably. Both endpoints use the
shared password-hash.ts utility with memoryCost=19456 KiB, timeCost=2 and
parallelism=1. Existing bcrypt test accounts need new registration or a proper
password reset; no automatic conversion or bcrypt fallback is implemented.

## Using the Guard in Orders

Import AuthModule in OrdersModule. Apply both decorators to the protected route:

```typescript
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
```

Read `req.user.userId` (type AuthenticatedUser) after the Guard succeeds. It comes
from the verified JWT sub. Never use request.body.userId as the order owner.
The Guard accepts Authorization: Bearer only, verifies HS256 signature/expiry,
requires exp and a UUID sub, and returns 401 UNAUTHORIZED for missing/invalid/
expired tokens. Tokens in the URL query are not accepted. Verification is
stateless; deleting a user does not itself revoke an already issued token.
Orders must handle its User foreign-key/business constraints.
Register, Login and Products remain public; no global JWT Guard is installed.
SCRUM-39 provides reusable authentication, without implementing Orders.

## Verification

Prisma validate/generate, lint and build passed against the shared User schema.
45 unit tests and 70 HTTP/E2E tests passed, including existing Register/Products.
New tests exercise real Argon2id, JWT signing/verification, token lifetime,
Register-to-Login hash compatibility, normalization, invalid credentials,
validation, safe errors, secret validation and a test-only guarded route with
missing, malformed, expired, wrong-key, wrong-algorithm and invalid-claim tokens.
HTTP tests mock PrismaService and do not contact PostgreSQL. Real database
Login/migrations still need a local smoke test using the commands above.
