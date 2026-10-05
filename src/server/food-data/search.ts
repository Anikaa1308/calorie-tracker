import "server-only";
import { looksBranded, rankFoods } from "@/lib/food-search";
import type { FoodDTO } from "@/lib/types";
import { db } from "../db";
import { searchLocalFoods } from "./local";
import { searchOpenFoodFacts } from "./openfoodfacts";
import { searchUsda, usdaEnabled } from "./usda";

export interface ProviderStatus {
  provider: "Open Food Facts" | "USDA";
  status: "ok" | "error" | "skipped";
  message?: string;
}

let brandNames: { at: number; names: string[] } | null = null;
async function knownBrands() {
  if (!brandNames || Date.now() - brandNames.at > 10 * 60_000) {
    brandNames = { at: Date.now(), names: (await db.brand.findMany({ select: { name: true } })).map((b) => b.name) };
  }
  return brandNames.names;
}

/**
 * Local database first (instant). External providers run in parallel only
 * when local results are thin or the query looks branded. External results
 * already imported locally are de-duplicated.
 */
export async function searchFoods(query: string, userId: string, opts: { external?: boolean } = {}) {
  const local = await searchLocalFoods(query, userId);
  const wantExternal =
    opts.external !== false && process.env.FOOD_SEARCH_EXTERNAL !== "off" && (local.length < 8 || looksBranded(query, await knownBrands()));
  if (!wantExternal) return { results: local, external: [] as ProviderStatus[] };

  const providers: [ProviderStatus["provider"], () => Promise<FoodDTO[]>][] = [
    ["Open Food Facts", () => searchOpenFoodFacts(query)],
    ...(usdaEnabled() ? ([["USDA", () => searchUsda(query)]] as [ProviderStatus["provider"], () => Promise<FoodDTO[]>][]) : []),
  ];
  const settled = await Promise.allSettled(providers.map(([, fn]) => fn()));
  const external: ProviderStatus[] = settled.map((s, i) =>
    s.status === "fulfilled"
      ? { provider: providers[i][0], status: "ok" }
      : { provider: providers[i][0], status: "error", message: String((s.reason as Error)?.message ?? s.reason) },
  );

  const localBarcodes = new Set(local.map((f) => f.barcode).filter(Boolean));
  const localNames = new Set(local.map((f) => `${f.brand ?? ""}|${f.name}`.toLowerCase()));
  const extFoods = settled
    .flatMap((s) => (s.status === "fulfilled" ? s.value : []))
    .filter((f) => !(f.barcode && localBarcodes.has(f.barcode)) && !localNames.has(`${f.brand ?? ""}|${f.name}`.toLowerCase()));

  // External results ranked among themselves; complete ones before ones missing nutrition.
  const ranked = rankFoods(query, extFoods).sort((a, b) => Number(!a.per100) - Number(!b.per100));
  return { results: [...local, ...ranked.slice(0, 20)], external };
}
