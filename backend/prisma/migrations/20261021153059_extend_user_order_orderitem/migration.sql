-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('PENDING', 'PAYMENT_FAILED', 'PAID', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "drink_size" AS ENUM ('S', 'M', 'L');

-- CreateEnum
CREATE TYPE "coupon_type" AS ENUM ('PERCENT', 'FIXED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255),
    "loyalty_points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "type" "coupon_type" NOT NULL,
    "value" INTEGER NOT NULL,
    "min_subtotal_vnd" BIGINT NOT NULL DEFAULT 0,
    "max_discount_vnd" BIGINT,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "usage_limit" INTEGER NOT NULL,
    "per_user_limit" INTEGER NOT NULL DEFAULT 1,
    "active_usage_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "coupon_id" UUID,
    "coupon_code_snapshot" VARCHAR(30),
    "status" "order_status" NOT NULL DEFAULT 'PENDING',
    "subtotal_vnd" BIGINT NOT NULL,
    "discount_vnd" BIGINT NOT NULL DEFAULT 0,
    "total_vnd" BIGINT NOT NULL,
    "points_earned" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "paid_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "product_name_snapshot" VARCHAR(255) NOT NULL,
    "size" "drink_size" NOT NULL,
    "size_percent_snapshot" INTEGER NOT NULL,
    "base_price_snapshot_vnd" BIGINT NOT NULL,
    "unit_price_vnd" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "line_total_vnd" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item_toppings" (
    "id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "topping_id" UUID NOT NULL,
    "topping_code_snapshot" VARCHAR(50) NOT NULL,
    "topping_name_snapshot" VARCHAR(255) NOT NULL,
    "topping_price_snapshot_vnd" BIGINT NOT NULL,

    CONSTRAINT "order_item_toppings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "ix_orders_user_id" ON "orders"("user_id");

-- CreateIndex
CREATE INDEX "ix_orders_user_created" ON "orders"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ix_order_items_order_id" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "ix_order_items_product_id" ON "order_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_order_item_topping" ON "order_item_toppings"("order_item_id", "topping_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_order_item_topping_code" ON "order_item_toppings"("order_item_id", "topping_code_snapshot");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_toppings" ADD CONSTRAINT "order_item_toppings_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_toppings" ADD CONSTRAINT "order_item_toppings_topping_id_fkey" FOREIGN KEY ("topping_id") REFERENCES "toppings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================
-- SCRUM-36: Business CHECK constraints
-- ============================================================

-- 1. Users
ALTER TABLE "users"
ADD CONSTRAINT "ck_users_loyalty_points_nonnegative"
CHECK ("loyalty_points" >= 0);


-- 2. Coupons
ALTER TABLE "coupons"
ADD CONSTRAINT "ck_coupons_value_nonnegative"
CHECK ("value" >= 0);

ALTER TABLE "coupons"
ADD CONSTRAINT "ck_coupons_min_subtotal_nonnegative"
CHECK ("min_subtotal_vnd" >= 0);

ALTER TABLE "coupons"
ADD CONSTRAINT "ck_coupons_max_discount_nonnegative"
CHECK ("max_discount_vnd" IS NULL OR "max_discount_vnd" >= 0);

ALTER TABLE "coupons"
ADD CONSTRAINT "ck_coupons_usage_limit_nonnegative"
CHECK ("usage_limit" >= 0);

ALTER TABLE "coupons"
ADD CONSTRAINT "ck_coupons_per_user_limit_nonnegative"
CHECK ("per_user_limit" >= 0);

ALTER TABLE "coupons"
ADD CONSTRAINT "ck_coupons_active_usage_count_nonnegative"
CHECK ("active_usage_count" >= 0);

ALTER TABLE "coupons"
ADD CONSTRAINT "ck_coupons_valid_date_range"
CHECK ("expires_at" > "starts_at");


-- 3. Orders
ALTER TABLE "orders"
ADD CONSTRAINT "ck_orders_subtotal_nonnegative"
CHECK ("subtotal_vnd" >= 0);

ALTER TABLE "orders"
ADD CONSTRAINT "ck_orders_discount_nonnegative"
CHECK ("discount_vnd" >= 0);

ALTER TABLE "orders"
ADD CONSTRAINT "ck_orders_total_nonnegative"
CHECK ("total_vnd" >= 0);

ALTER TABLE "orders"
ADD CONSTRAINT "ck_orders_points_earned_nonnegative"
CHECK ("points_earned" >= 0);

ALTER TABLE "orders"
ADD CONSTRAINT "ck_orders_discount_within_subtotal"
CHECK ("discount_vnd" <= "subtotal_vnd");

ALTER TABLE "orders"
ADD CONSTRAINT "ck_orders_total_calculation"
CHECK ("total_vnd" = "subtotal_vnd" - "discount_vnd");


-- 4. Order Items
ALTER TABLE "order_items"
ADD CONSTRAINT "ck_order_items_quantity_range"
CHECK ("quantity" BETWEEN 1 AND 10);

ALTER TABLE "order_items"
ADD CONSTRAINT "ck_order_items_size_percent"
CHECK (
    ("size" = 'S' AND "size_percent_snapshot" = 100)
    OR ("size" = 'M' AND "size_percent_snapshot" = 120)
    OR ("size" = 'L' AND "size_percent_snapshot" = 140)
);

ALTER TABLE "order_items"
ADD CONSTRAINT "ck_order_items_base_price_nonnegative"
CHECK ("base_price_snapshot_vnd" >= 0);

ALTER TABLE "order_items"
ADD CONSTRAINT "ck_order_items_unit_price_nonnegative"
CHECK ("unit_price_vnd" >= 0);

ALTER TABLE "order_items"
ADD CONSTRAINT "ck_order_items_line_total_nonnegative"
CHECK ("line_total_vnd" >= 0);

ALTER TABLE "order_items"
ADD CONSTRAINT "ck_order_items_line_total_calculation"
CHECK ("line_total_vnd" = "unit_price_vnd" * "quantity");


-- 5. Order Item Toppings
ALTER TABLE "order_item_toppings"
ADD CONSTRAINT "ck_order_item_toppings_price_nonnegative"
CHECK ("topping_price_snapshot_vnd" >= 0);

ALTER TABLE "coupons"
ADD CONSTRAINT "ck_coupons_percent_range"
CHECK ("type" <> 'PERCENT' OR "value" BETWEEN 0 AND 100);