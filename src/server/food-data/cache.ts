/** Small in-memory LRU with TTL for provider responses. */
export class LruCache<V> {
  private map = new Map<string, { value: V; expires: number }>();
  constructor(
    private max = 500,
    private ttlMs = 10 * 60_000,
  ) {}

  get(key: string): V | undefined {
    const hit = this.map.get(key);
    if (!hit) return undefined;
    if (hit.expires < Date.now()) {
      this.map.delete(key);
      return undefined;
    }
    this.map.delete(key);
    this.map.set(key, hit);
    return hit.value;
  }

  set(key: string, value: V) {
    this.map.delete(key);
    this.map.set(key, { value, expires: Date.now() + this.ttlMs });
    while (this.map.size > this.max) this.map.delete(this.map.keys().next().value!);
  }
}

export async function fetchJson<T>(url: string, timeoutMs = 3500, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
    headers: { "User-Agent": "Plate/0.1 (calorie tracker; https://github.com/Anikaa1308/calorie-tracker)", ...init?.headers },
  });
  if (!res.ok) throw new Error(`${new URL(url).host} responded ${res.status}`);
  return res.json() as Promise<T>;
}
