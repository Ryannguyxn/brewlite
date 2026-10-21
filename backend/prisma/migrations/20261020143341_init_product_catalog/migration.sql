-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "base_price_vnd" BIGINT NOT NULL,
    "image_url" VARCHAR(2048) NOT NULL,
    "stock" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "toppings" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "price_vnd" BIGINT NOT NULL,

    CONSTRAINT "toppings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "toppings_code_key" ON "toppings"("code");

-- =====================================================
-- BrewLite SCRUM-21: Product Catalog CHECK Constraints
-- Source: Approved database/schema.dbml
-- =====================================================

-- Product stock must be non-negative
ALTER TABLE "products"
ADD CONSTRAINT "ck_products_stock_nonnegative"
CHECK ("stock" >= 0);

-- Product base price must be non-negative
ALTER TABLE "products"
ADD CONSTRAINT "ck_products_base_price_nonnegative"
CHECK ("base_price_vnd" >= 0);

-- Topping price must be non-negative
ALTER TABLE "toppings"
ADD CONSTRAINT "ck_toppings_price_nonnegative"
CHECK ("price_vnd" >= 0);
