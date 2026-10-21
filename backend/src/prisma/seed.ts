
import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured");
}

// Protect against accidentally seeding an unrelated database.
const databaseName = decodeURIComponent(
  new URL(databaseUrl).pathname.slice(1),
);

if (!["brewlite_db", "brewlite_migration_test"].includes(databaseName)) {
  throw new Error(`Seeding is not allowed for database: ${databaseName}`);
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

const imageUrl = "/images/product-placeholder.svg";

const products = [
  { id: "a1000000-0000-4000-8000-000000000001", name: "Cà phê đen", price: 30000, stock: 30 },
  { id: "a1000000-0000-4000-8000-000000000002", name: "Cà phê sữa", price: 35000, stock: 25 },
  { id: "a1000000-0000-4000-8000-000000000003", name: "Bạc xỉu", price: 40000, stock: 20 },
  { id: "a1000000-0000-4000-8000-000000000004", name: "Cappuccino", price: 45000, stock: 15 },
  { id: "a1000000-0000-4000-8000-000000000005", name: "Latte", price: 45000, stock: 15 },
  { id: "a1000000-0000-4000-8000-000000000006", name: "Trà đào cam sả", price: 42000, stock: 18 },
  { id: "a1000000-0000-4000-8000-000000000007", name: "Matcha Latte", price: 50000, stock: 10 },
  { id: "a1000000-0000-4000-8000-000000000008", name: "Trà sữa truyền thống", price: 40000, stock: 0 },
] as const;

const toppings = [
  { id: "b2000000-0000-4000-8000-000000000001", code: "PEARL", name: "Trân châu", price: 5000 },
  { id: "b2000000-0000-4000-8000-000000000002", code: "CHEESE_FOAM", name: "Kem cheese", price: 10000 },
  { id: "b2000000-0000-4000-8000-000000000003", code: "EXTRA_SHOT", name: "Thêm shot espresso", price: 12000 },
  { id: "b2000000-0000-4000-8000-000000000004", code: "GRASS_JELLY", name: "Sương sáo", price: 5000 },
  { id: "b2000000-0000-4000-8000-000000000005", code: "WHIPPED_CREAM", name: "Kem tươi", price: 8000 },
] as const;

async function main() {
  await prisma.$transaction(async (tx) => {
    for (const product of products) {
      const data = {
        name: product.name,
        basePriceVnd: BigInt(product.price),
        imageUrl,
        stock: product.stock,
      };

      await tx.product.upsert({
        where: { id: product.id },
        create: { id: product.id, ...data },
        update: data,
      });
    }

    for (const topping of toppings) {
      const data = {
        name: topping.name,
        priceVnd: BigInt(topping.price),
      };

      await tx.topping.upsert({
        where: { code: topping.code },
        create: {
          id: topping.id,
          code: topping.code,
          ...data,
        },
        update: data,
      });
    }
  });

  console.log(`Seed completed: ${products.length} products, ${toppings.length} toppings`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
