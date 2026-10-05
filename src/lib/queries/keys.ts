export const qk = {
  day: (date: string) => ["day", date] as const,
  search: (q: string) => ["food-search", q] as const,
  library: (tab: string) => ["library", tab] as const,
  food: (id: string) => ["food", id] as const,
  profile: ["profile"] as const,
  goals: ["goals"] as const,
  history: (days: number, end: string) => ["history", days, end] as const,
  weights: ["weights"] as const,
  recipes: ["recipes"] as const,
  recipe: (id: string) => ["recipe", id] as const,
};
