-- CreateEnum
CREATE TYPE "redemption_status"
AS ENUM ('HELD', 'CONSUMED', 'RELEASED');

-- CreateTable
CREATE TABLE "coupon_redemptions" (
    "id" UUID NOT NULL,
    "coupon_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "redemption_status" NOT NULL DEFAULT 'HELD',
    "held_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumed_at" TIMESTAMPTZ(6),
    "released_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_redemptions_pkey" PRIMARY KEY ("id")
);

-- Unique: One redemption per order
CREATE UNIQUE INDEX "uq_coupon_redemptions_order_id"
ON "coupon_redemptions"("order_id");

-- Lookup indexes
CREATE INDEX "ix_coupon_redemptions_coupon_status"
ON "coupon_redemptions"("coupon_id", "status");

CREATE INDEX "ix_coupon_redemptions_user_coupon_status"
ON "coupon_redemptions"("user_id", "coupon_id", "status");

-- Foreign keys
ALTER TABLE "coupon_redemptions"
ADD CONSTRAINT "coupon_redemptions_coupon_id_fkey"
FOREIGN KEY ("coupon_id")
REFERENCES "coupons"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "coupon_redemptions"
ADD CONSTRAINT "coupon_redemptions_order_id_fkey"
FOREIGN KEY ("order_id")
REFERENCES "orders"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "coupon_redemptions"
ADD CONSTRAINT "coupon_redemptions_user_id_fkey"
FOREIGN KEY ("user_id")
REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;