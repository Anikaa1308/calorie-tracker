import "server-only";
import type { FoodDTO } from "@/lib/types";
import { fetchJson, LruCache } from "./cache";
import { normalizeOff, type OffProduct } from "./normalize";

const FIELDS = "code,product_name,product_name_en,generic_name,brands,categories,quantity,serving_size,serving_quantity,product_quantity_unit,nutriments";
const base = () => (process.env.OPEN_FOOD_FACTS_URL || "https://world.openfoodfacts.org").replace(/\/$/, "");

const searchCache = new LruCache<FoodDTO[]>();
const productCache = new LruCache<FoodDTO | null>(1000, 60 * 60_000);

export async function searchOpenFoodFacts(query: string, limit = 15): Promise<FoodDTO[]> {
  const key = query.toLowerCase();
  const hit = searchCache.get(key);
  if (hit) return hit;
  const url = `${base()}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit}&fields=${FIELDS}`;
  const data = await fetchJson<{ products?: OffProduct[] }>(url);
  const foods = (data.products ?? []).map(normalizeOff).filter((f): f is FoodDTO => !!f);
  searchCache.set(key, foods);
  return foods;
}

export async function getOpenFoodFactsProduct(barcode: string): Promise<FoodDTO | null> {
  const hit = productCache.get(barcode);
  if (hit !== undefined) return hit;
  const data = await fetchJson<{ status?: number; product?: OffProduct }>(
    `${base()}/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${FIELDS}`,
    5000,
  );
  const food = data.status === 1 && data.product ? normalizeOff({ ...data.product, code: data.product.code ?? barcode }) : null;
  productCache.set(barcode, food);
  return food;
}
