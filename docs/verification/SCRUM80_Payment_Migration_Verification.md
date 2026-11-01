# SCRUM-80 / P2-06 – Payment Migration & Database Constraint Verification

**Updated:** 2026-11-01 (PR #120 – REQUEST CHANGES remediation evidence)
**Branch:** `SCRUM-80-P2-06-Verify-Payment-Migration-Constraints`
**Scope:** Migration and PostgreSQL constraint verification; no changes to `schema.prisma`, historical migrations, or payment business logic.
**Baseline:** 7 Phase 1 migrations plus 2 SCRUM-76 migrations, 9 total.
**Result:** **PASS on the two isolated Docker PostgreSQL test databases** for the workflow and DML suites listed below. This records observed terminal output supplied by the implementer; it is not CI or independent reviewer execution.

## 1. Previously verified baseline

| Check | Evidence | Status |
|---|---|---|
| Clean database migration | 9/9 migrations applied on local PostgreSQL and Docker test database | PASS (prior local log) |
| Phase 1 Mock preservation | Three synthetic Mock Payments, one `SUCCESS` and two `FAILED`; provider backfilled to `MOCK`, `updated_at=created_at` | PASS (prior local log) |
| Legacy fingerprint | MD5 fingerprints for all three Phase 1 records unchanged before/after | PASS (prior local log) |
| Migration repeatability | Re-running `prisma migrate deploy` yielded `No pending migrations to apply` | PASS (prior Docker log) |
| Prisma validate/generate/build and unit tests | Prisma Client generate, Backend build and 163/163 unit tests passed earlier | PASS on prior source state; not re-executed at current HEAD |
| Catalog seed | `Seed completed: 9 menu products, 5 toppings` | Command succeeded; data counts and repeat-seed behavior not independently verified |

## 2. PR #120 Major request 1 – Reproducible Phase 1 → Phase 2 upgrade

**Command from repository root:**

```text
node scripts/scrum80/run_phase1_upgrade.mjs
```

**Target:** Docker Compose PostgreSQL, `127.0.0.1:55480`, database `brewlite_scrum80_legacy_verify`.

**Observed on 2026-11-01:**

```text
[SCRUM80] Safety preflight PASS: isolated Docker PostgreSQL 127.0.0.1:55480 / brewlite_scrum80_legacy_verify
[SCRUM80] Deploy 7 Phase 1 migrations
[SCRUM80] Insert Phase 1 legacy Mock FAILED/SUCCESS fixtures
[SCRUM80] Saved three Phase 1-only fingerprints (not payment payloads)
[SCRUM80] Pre-migrate target DB and Phase 1 baseline guard PASS
[SCRUM80] Apply the exact 2 SCRUM-76 migrations from repository (no migration edits)
[SCRUM80] PASS: 7 -> 9 migrations; 3/3 Mock fingerprints unchanged; provider and updated_at backfill verified
[SCRUM80] Non-destructive rerun check
[SCRUM80] PASS: Phase 1 -> Phase 2 upgrade verified on isolated Docker PostgreSQL
```

**Result: PASS.** The workflow reproduces the seven baseline migrations, inserts legacy Mock fixture data, captures pre-upgrade fingerprints, applies SCRUM-76 migrations #8 and #9, verifies provider/timestamps and compares fingerprints. The target database and Phase 1 migration state are checked before upgrade. A rerun of deploy is checked after migration. The database is restricted to a dedicated Docker fixture; the script refuses an existing legacy database unless the operator explicitly opts into its documented test-only reset.

**Non-blocking observation:** Node.js v24 emitted `DEP0190` concerning `shell: true` when spawning `npx` on Windows. The workflow passed; address this separately if the reviewer requires warning-free command execution. Do not interpolate untrusted input into process arguments.

## 3. PR #120 Major request 2 – PostgreSQL index, UNIQUE and CHECK DML

**Commands from repository root:**

```text
node scripts/scrum80/run_db_checks.mjs
node scripts/scrum80/run_db_checks.mjs --legacy
```

| Target | Safety preflight | Index catalog | UNIQUE positive/negative DML | CHECK negative DML | Transaction rollback |
|---|---|---|---|---|---|
| `brewlite_scrum80_verify` | PASS, exactly nine migrations | PASS | PASS | PASS | PASS |
| `brewlite_scrum80_legacy_verify` | PASS, exactly nine migrations | PASS | PASS | PASS | PASS |

The five verified unique indexes are:

- `uq_payments_user_idempotency`
- `uq_payments_vnp_txn_ref`
- `uq_payments_one_success_per_order` (partial: `status=SUCCESS`)
- `uq_payments_one_pending_vnpay_per_order` (partial: `provider=VNPAY AND status=PENDING`)
- `uq_orders_one_active_per_user` (partial: `PENDING` or `PAYMENT_FAILED`)

**Observed from both databases:**

```text
SCRUM-80 INDEX CATALOG PASS: five UNIQUE indexes present, valid and correctly filtered
SCRUM-80 UNIQUE tests PASS: active Order, idempotency (same/cross provider), SUCCESS, VNPay TxnRef, VNPay PENDING; all fixtures ROLLBACK
SCRUM80 CHECK DML PASS: provider, zero amount, VNPay, lifecycle, reconciliation, exception and event evidence; ROLLBACK
[SCRUM80] SQL INDEX + UNIQUE + CHECK DML: completed without psql errors; fixtures rolled back.
```

The `06_p2_06_check_constraints.sql` cases tested the Phase 1 amount constraint and the Phase 2 Payment/Gateway Event CHECK conditions using DML failures with expected SQLSTATE `23514` and matching constraint names. Covered categories include MOCK shape, ZERO_AMOUNT, VNPay metadata, PENDING/terminal fields, reconciliation state, financial exception and gateway event evidence. The test printed individual PASS notices and ended in `ROLLBACK` for **both** databases.

**Result: PASS.** This proves the database constraints for the specific tested cases. It does not itself demonstrate all concurrency, service-level or gateway behavior.

## 4. PR #120 Major request 3 – Portable/repeatable runbook and guarded targets

Deliverables:

- `docs/verification/SCRUM80_Payment_Migration_Runbook.md`: repo-relative commands for Git Bash and PowerShell; separate Docker Compose service, migrate deploy/status, required environment file, and safe rerun steps.
- `scripts/scrum80/run_phase1_upgrade.mjs`: migration workflow with fixed expected Docker port/database, pre-migration Phase 1 guard and explicit test-only reset.
- `scripts/scrum80/run_db_checks.mjs`: exact `current_database()` validation via `psql -qAt`, nine-applied-migration guard, then SQL execution through Docker stdin.
- SQL fixtures and assertions: `backend/prisma/tests/06_p2_06_check_constraints.sql` through `09_assert_legacy_after_phase2.sql`.

**Execution result: PASS on Git Bash/Windows (observed).** Commands are repository-relative; the runner discovers repo root from its script location. PowerShell instructions are included but **a PowerShell execution has not been observed**. No shared/production database was targeted. The test-only reset is explicitly destructive to the isolated legacy fixture DB and requires opt-in.

## 5. Evidence to include in PR #120

The latest implementer terminal logs contain:

1. `run_phase1_upgrade.mjs` output showing 7 → 9 migrations, 3/3 fingerprints, backfill, and repeat deploy checks.
2. `run_db_checks.mjs` output for the regular Docker test database with the five indexes, UNIQUE and CHECK suites passing with `ROLLBACK`.
3. `run_db_checks.mjs --legacy` output proving the same checks pass after upgrading the legacy fixture database.

Before requesting re-review: commit the four SQL files, two Node scripts and the updated runbook/report; run `git diff --cached --check`; push to the existing SCRUM-80 PR #120 source branch. Do **not** stage the PR #109 `docs/integration/` guide or `.env.scrum80.local`.

## 6. Explicit limitations / outstanding decisions

- Results are local Docker PostgreSQL evidence, not CI or an independent reviewer run.
- Historical Mock preservation uses **three synthetic fixtures**, not a full production snapshot.
- Tests do not establish VNPay HMAC correctness, QueryDR, real IPN, Return URL trust, HTTP/E2E concurrency, automatic refunds, or complete service integration.
- Catalog seed repeatability and a second independent run in PowerShell are not evidenced here; these do not supersede the PostgreSQL verification evidence above.
- PR #120 reviewer approval, merge, and Jira Done remain pending until confirmed by the team.
