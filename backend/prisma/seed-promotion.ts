/** SCRUM-53: independent, opt-in demo coupons (no product, user or order mutations). */
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
if (!allowedName || dbName !== allowedName) {
  throw new Error('Set SEED_PROMO_ALLOWED_DATABASE to the exact database name from DATABASE_URL');
}
// Defense in depth. A tunnel or proxy on localhost is still possible: confirm DB identity below.
if (!['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)) {
  throw new Error('Only local PostgreSQL connections allowed for demo coupon seed');
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
async function main() {
  const rows = await prisma.$queryRaw<Array<{ name: string; addr: string | null }>>`
    SELECT current_database() AS name, inet_server_addr()::text AS addr
  `;
  const current = rows[0];
  if (!current || current.name !== dbName) throw new Error('Actual connected database does not match DATABASE_URL');
  console.log(`Target database: ${current.name} (server: ${current.addr ?? 'local'})`);
  const rl = createInterface({ input: stdin, output: stdout });
  let answer: string;
  try { answer = await rl.question(`Type SEED PROMO ${dbName} to insert demo coupons: `); }
  finally { rl.close(); }
  if (answer.trim() !== `SEED PROMO ${dbName}`) throw new Error('Confirmation failed; nothing written');

  const coupons = [
    { code: 'WELCOME20', type: 'PERCENT' as const, value: 20, minSubtotalVnd: 50000n, maxDiscountVnd: 20000n, usageLimit: 100, perUserLimit: 1 },
    { code: 'BREWLITE10K', type: 'FIXED' as const, value: 10000, minSubtotalVnd: 50000n, maxDiscountVnd: null, usageLimit: 100, perUserLimit: 2 },
  ];
  // Stable validity for demo; these are *example* marketing rules pending owner approval.
  const startsAt = new Date('2026-01-01T00:00:00.000Z');
  const expiresAt = new Date('2027-12-31T23:59:59.000Z');
  let created = 0;
  for (const c of coupons) {
    // create-if-absent only: never overwrite quotas, counters, validity, or old coupon state.
    const result = await prisma.coupon.createMany({
      data: [{ ...c, startsAt, expiresAt, activeUsageCount: 0 }],
      skipDuplicates: true,
    });
    created += result.count;
  }
  console.log(`Promotion seed complete: ${created} created, ${coupons.length - created} already existed.`);
}
main().catch(e => { console.error('Promotion seed failed:', e.message); process.exitCode = 1; })
  .finally(async () => prisma.$disconnect());
