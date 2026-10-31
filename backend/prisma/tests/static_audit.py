"""Offline source-level review. This DOES NOT replace Prisma/PostgreSQL validation."""
from pathlib import Path
import re, hashlib
root=Path(__file__).resolve().parent.parent
s=(root/'backend/prisma/schema.prisma').read_text(encoding='utf-8')
m1=(root/'backend/prisma/migrations/20261031190000_scrum76_payment_pending_enum/migration.sql').read_text()
m2=(root/'backend/prisma/migrations/20261031190100_scrum76_payment_gateway_delta/migration.sql').read_text()
db=(root/'reference/schema_phase2_proposed_v0.2.2_CK-R01-R03_UPDATED.dbml').read_text()
pre=(root/'backend/prisma/migrations/20261026065408_add_payment_schema/migration.sql').read_text()
assert len(re.findall(r'^model\s+\w+\s*\{',s,re.M))==12
assert 'model PaymentGatewayEvent {' in s and 'enum PaymentProvider {' in s
assert 'PENDING' in s.split('enum PaymentStatus {',1)[1].split('}',1)[0]
assert 'updatedAt' in s.split('model Payment {',1)[1]
assert '@updatedAt' not in s.split('model Payment {',1)[1].split('model PaymentGatewayEvent {',1)[0].replace('no Prisma @updatedAt','')
assert s.count('@@unique([userId, idempotencyKey]')==1
assert 'CREATE UNIQUE INDEX "uq_payments_one_success_per_order"' in pre
assert 'CREATE UNIQUE INDEX "uq_payments_one_pending_vnpay_per_order"' in m2
assert 'WHERE "provider" = \'VNPAY\' AND "status" = \'PENDING\'' in m2
assert 'DROP INDEX' not in m2 and 'DROP TABLE' not in m2 and 'UPDATE "payments" SET "response_snapshot"' not in m2
assert 'ALTER TYPE "payment_status" ADD VALUE \'PENDING\' BEFORE \'SUCCESS\'' in m1
for col in ['provider','updated_at','vnp_txn_ref','vnp_tmn_code','gateway_expires_at','query_attempts','has_financial_exception']:
 assert col in m2, col
for table in ('payments','payment_gateway_events'):
 raw=db.split('Table '+table+' {',1)[1].split('\n}',1)[0]
 block=raw.split('  checks {',1)[1].split('\n  }',1)[0]
 found=re.findall(r'^\s*`(.+?)` \[name: \'([^\']+)\'\]',block,re.M)
 for expr,name in found:
  if name=='ck_payments_amount_nonnegative':
   assert '"ck_payments_amount_nonnegative"' in pre
  else:
   line=f'ALTER TABLE "{table}" ADD CONSTRAINT "{name}" CHECK ({expr});'
   assert line in m2, f'{name} SQL differs from DBML'
 print(f'{table} CHECKs match DBML:',len(found))
for enum in ['payment_provider','payment_reconciliation_state','payment_gateway_source','payment_gateway_outcome','payment_gateway_disposition']:
 assert f'CREATE TYPE "{enum}"' in m2
print('Schema: 12 models; legacy partial unique kept; 2 new migrations; phase2 CHECK text same as DBML: PASS')
print('Full Prisma validate, PostgreSQL migration and integration testing: NOT RUN HERE')
