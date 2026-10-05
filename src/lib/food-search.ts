/**
 * Search ranking. Pure so it can be unit-tested and shared by the local
 * database search and by merged external results.
 *
 * Order of strength: exact product name → exact brand match → name starts
 * with the query → all query tokens match → category match → popularity,
 * with a boost for foods the person logs often or recently.
 */

export interface RankCandidate {
  id: string;
  name: string;
  brand?: string | null;
  category?: string | null;
  /** Other names, e.g. "chapati" for roti. */
  aliases?: string[];
  popularity?: number;
}

export interface HistoryInfo {
  timesLogged: number;
  lastUsedAt: Date | string;
}

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9%]+/g, " ")
    .trim();
}

export function tokenize(s: string): string[] {
  return normalize(s).split(" ").filter(Boolean);
}

const tokenMatches = (q: string, words: string[]) =>
  words.some((w) => w === q || w.startsWith(q) || (q.length >= 4 && w.includes(q)));

export function scoreCandidate(
  query: string,
  c: RankCandidate,
  history?: HistoryInfo,
  now: Date = new Date(),
): number {
  const q = normalize(query);
  if (!q) return 0;
  const qTokens = q.split(" ");
  const name = normalize(c.name);
  const brand = c.brand ? normalize(c.brand) : "";
  const full = brand ? `${brand} ${name}` : name;
  const aliases = (c.aliases ?? []).map(normalize);
  const nameWords = [...name.split(" "), ...aliases.flatMap((a) => a.split(" "))];
  const allWords = [...nameWords, ...brand.split(" ").filter(Boolean)];

  let score = 0;
  if (name === q || full === q || aliases.includes(q)) score = 1000;
  else if (brand && (q === brand || q.startsWith(`${brand} `)) && qTokens.every((t) => tokenMatches(t, allWords)))
    score = 800;
  else if (name.startsWith(q) || full.startsWith(q) || aliases.some((a) => a.startsWith(q))) score = 600;
  else if (qTokens.every((t) => tokenMatches(t, allWords))) score = 400;
  else if (c.category && normalize(c.category).includes(q)) score = 200;
  else {
    const hits = qTokens.filter((t) => tokenMatches(t, allWords)).length;
    if (hits === 0) return 0;
    score = 100 * (hits / qTokens.length);
  }

  // Shorter names are usually the generic item ("Banana" before "Banana chips").
  score -= Math.min(name.length, 60) * 0.5;
  score += Math.min(c.popularity ?? 0, 100) * 0.5;

  if (history) {
    const last = new Date(history.lastUsedAt).getTime();
    const days = Math.max(0, (now.getTime() - last) / 86_400_000);
    score += Math.min(history.timesLogged, 20) * 3 + Math.max(0, 30 - days);
  }
  return score;
}

export function rankFoods<T extends RankCandidate>(
  query: string,
  candidates: T[],
  history: Map<string, HistoryInfo> = new Map(),
  now: Date = new Date(),
): T[] {
  return candidates
    .map((c) => ({ c, s: scoreCandidate(query, c, history.get(c.id), now) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.c.name.localeCompare(b.c.name))
    .map((x) => x.c);
}

/** True when a query looks like a packaged/branded product, so external providers are worth asking. */
export function looksBranded(query: string, knownBrands: string[] = []): boolean {
  const q = normalize(query);
  if (/\d+\s?(g|ml|kg)\b/.test(q)) return true;
  return knownBrands.some((b) => q.includes(normalize(b)));
}
