/**
 * SCRUM-53: approved Sprint 3 / Assignment 1 demo coupon data.
 * Standalone, opt-in seed. Creates coupons only; never modifies existing rows.
 */
import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL must be set');
const parsed = new URL(url);
const dbName = decodeURIComponent(parsed.pathname.slice(1));
const allowedName = process.env.SEED_PROMO_ALLOWED_DATABASE;
if (!dbName || !allowedName || dbName !== allowedName) {
  throw new Error('Set SEED_PROMO_ALLOWED_DATABASE to the exact database name from DATABASE_URL');
}
// Require an explicit local connection, checked again against PostgreSQL below.
if (!['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)) {
  throw new Error('Only local PostgreSQL connections allowed for demo coupon seed');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
const VALIDITY_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

async function main(): Promise<void> {
  const rows = await prisma.$queryRaw<Array<{ name: string; addr: string | null }>>`
    SELECT current_database() AS name, inet_server_addr()::text AS addr
  `;
  const current = rows[0];
  if (!current || current.name !== dbName) {
    throw new Error('Actual connected database does not match DATABASE_URL');
  }

  console.log(`Target database: ${current.name} (server: ${current.addr ?? 'local'})`);
  const rl = createInterface({ input: stdin, output: stdout });
  let answer: string;
  try {
    answer = await rl.question(`Type SEED PROMO ${dbName} to insert demo coupons: `);
  } finally {
    rl.close();
  }
  if (answer.trim() !== `SEED PROMO ${dbName}`) {
    throw new Error('Confirmation failed; nothing written');
  }

  // Compute dates at execution time, after user confirmation. Same window for all coupons.
  const startsAt = new Date();
  const expiresAt = new Date(startsAt.getTime() + VALIDITY_DAYS * DAY_MS);

  // Officially approved demo data. QUOTA1K is for total/per-user quota integration tests.
  const coupons = [
    {
      code: 'WELCOME20',
      type: 'PERCENT' as const,
      value: 20,
      minSubtotalVnd: 50000n,
      maxDiscountVnd: 30000n,
      usageLimit: 100,
      perUserLimit: 1,
    },
    {
      code: 'BREWLITE10K',
      type: 'FIXED' as const,
      value: 10000,
      minSubtotalVnd: 50000n,
      maxDiscountVnd: null,
      usageLimit: 100,
      perUserLimit: 2,
    },
    {
      code: 'QUOTA1K',
      type: 'FIXED' as const,
      value: 1000,
      minSubtotalVnd: 10000n,
      maxDiscountVnd: null,
      usageLimit: 1,
      perUserLimit: 1,
    },
  ];

  // Single INSERT .. ON CONFLICT DO NOTHING operation. No update, delete or counter reset.
  const result = await prisma.coupon.createMany({
    data: coupons.map((coupon) => ({
      ...coupon,
      startsAt,
      expiresAt,
      activeUsageCount: 0,
    })),
    skipDuplicates: true,
  });
  console.log(
    `Promotion seed complete: ${result.count} created, ${coupons.length - result.count} already existed.`,
  );
  if (result.count > 0) {
    console.log(`New coupon validity: ${startsAt.toISOString()} to ${expiresAt.toISOString()} (30 days).`);
  }
  console.log('Existing coupons were not modified, including their validity and usage counters.');
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown seed error';
    console.error('Promotion seed failed:', message);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
