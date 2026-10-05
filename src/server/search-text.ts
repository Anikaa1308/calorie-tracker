import { normalize } from "@/lib/food-search";

/** The lower-cased text the trigram index searches over. */
export function buildSearchText(name: string, brand?: string | null, aliases: string[] = []): string {
  return normalize([brand ?? "", name, ...aliases].join(" "));
}

export function slugify(s: string): string {
  return normalize(s).replace(/\s+/g, "-");
}
