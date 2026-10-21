-- ============================================================
-- SCRUM-36 Follow-up: Active Order and Coupon Constraints
-- PR #54 Review Fixes
-- ============================================================

-- 1. Only one active order per user.
-- Active statuses: PENDING, PAYMENT_FAILED.

CREATE UNIQUE INDEX "uq_orders_one_active_per_user"
ON "orders" ("user_id")
WHERE "status" IN ('PENDING', 'PAYMENT_FAILED');


-- 2. Replace weaker Coupon constraints.

ALTER TABLE "coupons"
DROP CONSTRAINT "ck_coupons_value_nonnegative";

ALTER TABLE "coupons"
ADD CONSTRAINT "ck_coupons_value_positive"
CHECK ("value" > 0);


ALTER TABLE "coupons"
DROP CONSTRAINT "ck_coupons_usage_limit_nonnegative";

ALTER TABLE "coupons"
ADD CONSTRAINT "ck_coupons_usage_limit_positive"
CHECK ("usage_limit" >= 1);


ALTER TABLE "coupons"
DROP CONSTRAINT "ck_coupons_per_user_limit_nonnegative";

ALTER TABLE "coupons"
ADD CONSTRAINT "ck_coupons_per_user_limit_positive"
CHECK ("per_user_limit" >= 1);


-- 3. Active usage must not exceed total quota.

ALTER TABLE "coupons"
ADD CONSTRAINT "ck_coupons_active_usage_within_limit"
CHECK ("active_usage_count" <= "usage_limit");