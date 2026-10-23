-- CreateEnum
CREATE TYPE "product_size_policy" AS ENUM ('STANDARD', 'ONE_SIZE');

-- AlterEnum
ALTER TYPE "drink_size" ADD VALUE 'ONE_SIZE';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "category_id" UUID,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "is_bestseller" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_new" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rating" DECIMAL(2,1),
ADD COLUMN     "size_policy" "product_size_policy" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "toppings" ADD COLUMN     "is_available" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);
-- Seed initial product categories
INSERT INTO "categories" ("id", "code", "name", "is_active")
VALUES
  ('b1000000-0000-4000-8000-000000000001', 'traditional', 'Cà phê truyền thống', TRUE),
  ('b1000000-0000-4000-8000-000000000002', 'espresso_coldbrew', 'Espresso & Cold Brew', TRUE),
  ('b1000000-0000-4000-8000-000000000003', 'tea_macchiato', 'Trà & Macchiato', TRUE),
  ('b1000000-0000-4000-8000-000000000004', 'bakery', 'Bánh & Ăn nhẹ', TRUE);

-- Backfill category for existing traditional coffee product
UPDATE "products"
SET "category_id" = 'b1000000-0000-4000-8000-000000000001'
WHERE "id" = 'a1000000-0000-4000-8000-000000000001'
  AND "category_id" IS NULL;

-- Ensure all existing products have a category
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "products"
    WHERE "category_id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Product category backfill incomplete';
  END IF;
END
$$;

-- Enforce required category after backfill
ALTER TABLE "products"
ALTER COLUMN "category_id" SET NOT NULL;

-- Product rating constraint
-- Stock and base price CHECK constraints already exist in earlier migrations.
ALTER TABLE "products"
ADD CONSTRAINT "ck_products_rating_range"
CHECK ("rating" BETWEEN 0 AND 5);

-- CreateTable
CREATE TABLE "product_toppings" (
    "product_id" UUID NOT NULL,
    "topping_id" UUID NOT NULL,

    CONSTRAINT "product_toppings_pkey" PRIMARY KEY ("product_id","topping_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_code_key" ON "categories"("code");

-- CreateIndex
CREATE INDEX "ix_product_toppings_topping_id" ON "product_toppings"("topping_id");

-- CreateIndex
CREATE INDEX "ix_products_category_id" ON "products"("category_id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_toppings" ADD CONSTRAINT "product_toppings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_toppings" ADD CONSTRAINT "product_toppings_topping_id_fkey" FOREIGN KEY ("topping_id") REFERENCES "toppings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
