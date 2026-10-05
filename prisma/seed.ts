import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Confidence, type FoodSource } from "../src/generated/prisma/client";
import { buildSearchText, slugify } from "../src/server/search-text";
import { SEED_FOODS } from "./seed-data";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const SOURCE: Record<string, { source: FoodSource; confidence: Confidence }> = {
  USDA: { source: "USDA", confidence: "HIGH" },
  ESTIMATED: { source: "ESTIMATED", confidence: "MEDIUM" },
  SAMPLE: { source: "SAMPLE", confidence: "LOW" },
};

async function main() {
  let count = 0;
  for (const f of SEED_FOODS) {
    const brand = f.brand
      ? await prisma.brand.upsert({
          where: { slug: slugify(f.brand) },
          create: { name: f.brand, slug: slugify(f.brand) },
          update: { name: f.brand },
        })
      : null;
    const { source, confidence } = SOURCE[f.source];
    const externalId = `seed:${slugify([f.brand ?? "", f.name].join(" "))}`;
    const [calories, protein, carbs, fat, fiber] = f.n;
    const data = {
      name: f.name,
      brandId: brand?.id ?? null,
      category: f.category,
      kind: f.brand ? ("BRANDED" as const) : ("GENERIC" as const),
      basis: f.basis ?? ("PER_100G" as const),
      densityGPerMl: f.density ?? null,
      source,
      confidence,
      sourceNote: f.note ?? null,
      popularity: f.popularity ?? 0,
      aliases: f.aliases ?? [],
      searchText: buildSearchText(f.name, f.brand, f.aliases),
    };
    const food = await prisma.food.upsert({
      where: { source_externalId: { source, externalId } },
      create: { ...data, externalId },
      update: data,
    });
    await prisma.foodNutrition.upsert({
      where: { foodId: food.id },
      create: { foodId: food.id, calories, protein, carbs, fat, fiber },
      update: { calories, protein, carbs, fat, fiber },
    });
    await prisma.foodServing.deleteMany({ where: { foodId: food.id } });
    if (f.servings?.length) {
      await prisma.foodServing.createMany({
        data: f.servings.map(([label, unit, grams], i) => ({
          foodId: food.id,
          label,
          unit,
          grams,
          isDefault: i === 0,
          position: i,
        })),
      });
    }
    count++;
  }
  console.log(`Seeded ${count} foods.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
