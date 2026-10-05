import "server-only";
import type { FoodDTO } from "@/lib/types";
import { fetchJson, LruCache } from "./cache";
import { normalizeUsda, type UsdaFood } from "./normalize";

const BASE = "https://api.nal.usda.gov/fdc/v1";
const searchCache = new LruCache<FoodDTO[]>();
const foodCache = new LruCache<FoodDTO>(1000, 60 * 60_000);

export const usdaEnabled = () => !!process.env.USDA_API_KEY;

export async function searchUsda(query: string, limit = 15): Promise<FoodDTO[]> {
  const key = process.env.USDA_API_KEY;
  if (!key) return [];
  const cacheKey = query.toLowerCase();
  const hit = searchCache.get(cacheKey);
  if (hit) return hit;
  const data = await fetchJson<{ foods?: UsdaFood[] }>(`${BASE}/foods/search?api_key=${key}`, 3500, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, pageSize: limit, dataType: ["Foundation", "SR Legacy", "Branded"] }),
  });
  const foods = (data.foods ?? []).map(normalizeUsda);
  searchCache.set(cacheKey, foods);
  return foods;
}

export async function getUsdaFood(fdcId: string): Promise<FoodDTO | null> {
  const key = process.env.USDA_API_KEY;
  if (!key || !/^\d+$/.test(fdcId)) return null;
  const hit = foodCache.get(fdcId);
  if (hit) return hit;
  const data = await fetchJson<UsdaFood>(`${BASE}/food/${fdcId}?api_key=${key}`, 5000);
  const food = normalizeUsda(data);
  foodCache.set(fdcId, food);
  return food;
}
