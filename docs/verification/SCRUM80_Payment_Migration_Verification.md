# SCRUM-80 / P2-06 — Verify Payment Migration & Database Constraints

**Evidence update:** 2026-11-01
**Branch:** `SCRUM-80-P2-06-Verify-Payment-Migration-Constraints`
**Baseline:** SCRUM-76 changes already merged into `dev` (reported by `git merge-base --is-ancestor`, then fast-forward pull).
**Status:** **VERIFICATION SUBSTANTIALLY PASSED; HANDOFF / SEED REPEATABILITY / CURRENT-BRANCH CHECKS PENDING.**

## 1. Proven by reported terminal output

| Gate | Target or execution | Result |
|---|---|---|
| Prisma validate / generate | Local SCRUM-76 schema; Prisma Client 7.10.1 | PASS (previous SCRUM-76 run) |
| Clean database migration | Local PostgreSQL `brewlite_scrum76_verify`, all nine migrations | PASS |
| Local structural constraints | `02_postflight_assertions.sql` | PASS |
| Local mutation-based constraints | `03_constraints_rollback.sql`, disposable fixture | PASS, ROLLBACK |
| Phase 1 → Phase 2 upgrade | `brewlite_scrum76_legacy_verify`, seven then two migrations | PASS |
| Backfill legacy Mock | Three sample Payments: one SUCCESS, two FAILED | PASS; provider=MOCK; updated_at=created_at |
| Legacy field preservation | Fingerprints before and after | PASS, 3/3 unchanged |
| Local SQL index predicates | `05_p2_06_index_catalog.sql` | PASS, all five UNIQUE indexes |
| Local unique mutation tests | `04_p2_06_unique_constraints.sql` | PASS, ROLLBACK |
| Docker Engine / Compose | Docker Engine 29.9.2, Compose v5.6.1 | AVAILABLE |
| Isolated Docker PostgreSQL | `postgres:18-alpine`, service `postgres`, port 127.0.0.1:55480, database `brewlite_scrum80_verify` | RUNNING / CONNECTED |
| Docker schema migration | Nine `_prisma_migrations` rows, each `finished_at IS NOT NULL` | PASS |
| Docker migrate status | Prisma `Database schema is up to date!` | PASS |
| Repeat `migrate deploy` on Docker DB | Prisma `No pending migrations to apply.` | PASS |
| Docker SQL index predicates | `05_p2_06_index_catalog.sql` | PASS; all five indexes |
| Docker SQL unique positive / negative tests | `04_p2_06_unique_constraints.sql` | PASS; transaction ROLLBACK |
| Seed command | `npm run db:seed` printed `Seed completed: 9 menu products, 5 toppings; no legacy products present.` | COMMAND PASS; database row counts not independently confirmed |
| Earlier Backend build / unit tests | SCRUM-76 branch, 18 test files / 163 tests | PASS at that time; rerun on current merged SCRUM-80 baseline |

**Five verified UNIQUE indexes:** `uq_payments_user_idempotency` (ordinary), `uq_payments_vnp_txn_ref` (ordinary), `uq_payments_one_success_per_order` (partial), `uq_payments_one_pending_vnpay_per_order` (partial), `uq_orders_one_active_per_user` (partial).

## 2. Tests and reproducible configuration to commit

- `compose.scrum80.test.yml` at repository root, isolated Compose project, PostgreSQL port `127.0.0.1:55480`, dedicated named volume. Local `.env.scrum80.local` must **not** be committed.
- `backend/prisma/tests/04_p2_06_unique_constraints.sql` (SQLSTATE/constraint-name based DML tests, rollback).
- `backend/prisma/tests/05_p2_06_index_catalog.sql` (catalog inspection and predicate verification).
- This verification report.
- Keep all existing Prisma schema and nine migrations unchanged; P2-06 verifies, it does not modify migration history.

### Commands to reproduce tests in isolated Docker DB

From `D:/Projects/brewlite` (with the test Compose file and private `.env.scrum80.local` present):

```bash
docker compose --env-file .env.scrum80.local -f compose.scrum80.test.yml up -d postgres
docker compose --env-file .env.scrum80.local -f compose.scrum80.test.yml ps

docker compose --env-file .env.scrum80.local -f compose.scrum80.test.yml exec -T postgres \
  psql -X -v ON_ERROR_STOP=1 -U postgres -d brewlite_scrum80_verify \
  < backend/prisma/tests/05_p2_06_index_catalog.sql

docker compose --env-file .env.scrum80.local -f compose.scrum80.test.yml exec -T postgres \
  psql -X -v ON_ERROR_STOP=1 -U postgres -d brewlite_scrum80_verify \
  < backend/prisma/tests/04_p2_06_unique_constraints.sql
```

Migration CLI was run from `backend/` with `DATABASE_URL` explicitly set to `postgresql://postgres:<secret>@127.0.0.1:55480/brewlite_scrum80_verify?schema=public`. Do not paste secrets into logs or PR. `migrate deploy` on the Docker database later yielded `No pending migrations to apply.`.

## 3. Remaining gates (do not mark PASS without executing)

1. Independently confirm Docker seed rows and source `backend/prisma/seed.ts`; determine whether repeat seed is safe and run twice only after reviewing effects. The reported `npm run db:seed` command passed but target counts are not yet logged.
2. Rerun `python backend/prisma/tests/static_audit.py` and `git diff --check` on **current branch**; confirm the two SCRUM-76 reviewer fixes are included.
3. Rerun `npm run db:validate`, `npm run db:generate`, `npm run build`, and `npm test` on current merged `dev` baseline (new shared-finalization code merged after the earlier SCRUM-76 build/test run).
4. Commit tests, isolated Compose config, sanitized evidence; PR to `dev`. Confirm Hoàng/HKhang can reproduce/use the schema.
5. Optional: backend-to-Docker DB smoke test on a safe isolated environment, if DoD interpretation requires it. No production VNPay/HMAC/IPN/QueryDR integration claim is made by this task.

## 4. Constraints and limits

- Database UNIQUE/CHECK/FK tests do not prove full application-level finalization atomicity, concurrency under real HTTP requests, or financial gateway correctness.
- Legacy preservation test used exactly three synthetic Mock records, not all real customer data.
- Do not run destructive commands (`docker compose down -v`, `prisma migrate reset`) on shared environments; this report uses isolated test databases.
- Do not commit `.env.scrum80.local`, secrets, passwords, gateway tokens, or raw payment credentials.
