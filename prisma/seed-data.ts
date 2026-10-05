/**
 * Seed foods. Values are per 100 g (or 100 ml where basis is PER_100ML).
 *
 * Sources and how they are labelled in the app:
 * - USDA: USDA FoodData Central (SR Legacy / Foundation) reference values. Confidence HIGH.
 * - ESTIMATED: typical home-style Indian dishes. Values are calculated from
 *   their main ingredients or typical recipes and vary by preparation, so the
 *   UI labels them "Estimate". Confidence MEDIUM.
 * - SAMPLE: packaged products whose label values have not been verified
 *   against the pack. Labelled "Sample data, check the pack". Confidence LOW.
 *   Replace with Open Food Facts or label data when available.
 */

export type SeedSource = "USDA" | "ESTIMATED" | "SAMPLE";

export interface SeedFood {
  name: string;
  brand?: string;
  category: string;
  source: SeedSource;
  /** kcal, protein, carbs, fat, fiber per 100 g/ml. */
  n: [number, number, number, number, number];
  servings?: [label: string, unit: string, grams: number][];
  aliases?: string[];
  basis?: "PER_100G" | "PER_100ML";
  density?: number;
  popularity?: number;
  note?: string;
}

const KATORI = 150;

export const SEED_FOODS: SeedFood[] = [
  // ── Indian staples & dishes (estimates) ────────────────────────────────────
  { name: "Roti", category: "Breads", source: "ESTIMATED", n: [255, 9.9, 54, 1.9, 8], servings: [["1 roti", "piece", 40]], aliases: ["chapati", "phulka", "fulka"], popularity: 98, note: "Calculated from 30 g whole wheat flour per roti, no ghee." },
  { name: "Plain paratha", category: "Breads", source: "ESTIMATED", n: [302, 8.8, 48, 10, 7.1], servings: [["1 paratha", "piece", 60]], popularity: 70, note: "Calculated from 40 g atta and 1 tsp ghee." },
  { name: "Aloo paratha", category: "Breads", source: "ESTIMATED", n: [230, 5, 33, 8.5, 3], servings: [["1 paratha", "piece", 120]], popularity: 75 },
  { name: "Pav", category: "Breads", source: "ESTIMATED", n: [280, 8.5, 52, 4, 2.2], servings: [["1 pav", "piece", 35]], aliases: ["bun", "ladi pav"], popularity: 40 },
  { name: "Dal (toor, with tadka)", category: "Dals & curries", source: "ESTIMATED", n: [100, 5.5, 13, 2.8, 3.5], servings: [["1 katori", "katori", KATORI]], aliases: ["arhar dal", "toor dal", "dal tadka"], popularity: 95, note: "Typical home recipe; varies with thickness and oil." },
  { name: "Moong dal (cooked)", category: "Dals & curries", source: "ESTIMATED", n: [95, 6.2, 14, 1.6, 3], servings: [["1 katori", "katori", KATORI]], aliases: ["yellow dal"], popularity: 70 },
  { name: "Rajma curry", category: "Dals & curries", source: "ESTIMATED", n: [133, 6.5, 17, 4.5, 5.5], servings: [["1 katori", "katori", KATORI]], aliases: ["rajma"], popularity: 80 },
  { name: "Chole", category: "Dals & curries", source: "ESTIMATED", n: [160, 7, 20, 6, 6], servings: [["1 katori", "katori", KATORI]], aliases: ["chana masala", "chickpea curry"], popularity: 80 },
  { name: "Sambar", category: "Dals & curries", source: "ESTIMATED", n: [65, 3.2, 9, 1.8, 2.4], servings: [["1 katori", "katori", KATORI]], popularity: 75 },
  { name: "Palak paneer", category: "Dals & curries", source: "ESTIMATED", n: [180, 8, 6, 14, 2], servings: [["1 katori", "katori", KATORI]], popularity: 70 },
  { name: "Paneer butter masala", category: "Dals & curries", source: "ESTIMATED", n: [230, 8, 9, 18, 1.5], servings: [["1 katori", "katori", KATORI]], popularity: 65 },
  { name: "Paneer tikka", category: "Dals & curries", source: "ESTIMATED", n: [240, 15, 6, 17, 1], servings: [["1 piece", "piece", 30]], popularity: 50 },
  { name: "Chicken curry", category: "Dals & curries", source: "ESTIMATED", n: [150, 14, 4, 9, 0.8], servings: [["1 katori", "katori", KATORI]], popularity: 75 },
  { name: "Butter chicken", category: "Dals & curries", source: "ESTIMATED", n: [190, 13, 6, 13, 1], servings: [["1 katori", "katori", KATORI]], aliases: ["murgh makhani"], popularity: 65 },
  { name: "Mixed vegetable sabzi", category: "Dals & curries", source: "ESTIMATED", n: [95, 2.5, 9, 5.5, 3], servings: [["1 katori", "katori", KATORI]], aliases: ["sabji", "mix veg"], popularity: 70 },
  { name: "Aloo sabzi", category: "Dals & curries", source: "ESTIMATED", n: [120, 2, 15, 6, 2], servings: [["1 katori", "katori", KATORI]], aliases: ["potato sabji", "aloo bhaji"], popularity: 60 },
  { name: "Bhindi masala", category: "Dals & curries", source: "ESTIMATED", n: [110, 2.2, 9, 7.5, 3.4], servings: [["1 katori", "katori", 120]], aliases: ["okra fry", "bhindi fry"], popularity: 50 },
  { name: "Pav bhaji (bhaji)", category: "Dals & curries", source: "ESTIMATED", n: [110, 2.5, 13, 5.5, 3], servings: [["1 plate bhaji", "plate", 200]], popularity: 50 },
  { name: "Poha", category: "Breakfast", source: "ESTIMATED", n: [180, 3.5, 28, 6, 1.8], servings: [["1 plate", "plate", 150]], aliases: ["kanda poha", "aval"], popularity: 85, note: "Typical home recipe with oil and peanuts." },
  { name: "Upma", category: "Breakfast", source: "ESTIMATED", n: [160, 4, 22, 6.5, 1.8], servings: [["1 plate", "plate", 180]], popularity: 65 },
  { name: "Idli", category: "Breakfast", source: "ESTIMATED", n: [145, 4.4, 30, 0.5, 1.4], servings: [["1 idli", "piece", 40]], popularity: 85 },
  { name: "Plain dosa", category: "Breakfast", source: "ESTIMATED", n: [210, 4.5, 30, 7.5, 1.3], servings: [["1 dosa", "piece", 80]], aliases: ["sada dosa"], popularity: 80 },
  { name: "Masala dosa", category: "Breakfast", source: "ESTIMATED", n: [190, 3.8, 26, 8, 2], servings: [["1 dosa", "piece", 200]], popularity: 80 },
  { name: "Besan chilla", category: "Breakfast", source: "ESTIMATED", n: [190, 9, 20, 8, 4], servings: [["1 chilla", "piece", 70]], aliases: ["cheela", "puda"], popularity: 45 },
  { name: "Steamed white rice", category: "Grains", source: "USDA", n: [130, 2.7, 28.2, 0.3, 0.4], servings: [["1 katori", "katori", KATORI], ["1 cup", "cup", 158]], aliases: ["chawal", "rice"], popularity: 97 },
  { name: "Brown rice (cooked)", category: "Grains", source: "USDA", n: [123, 2.7, 25.6, 1, 1.6], servings: [["1 katori", "katori", KATORI]], popularity: 55 },
  { name: "Jeera rice", category: "Grains", source: "ESTIMATED", n: [160, 2.8, 28, 4, 0.6], servings: [["1 katori", "katori", KATORI]], popularity: 55 },
  { name: "Chicken biryani", category: "Grains", source: "ESTIMATED", n: [165, 8, 22, 5, 0.8], servings: [["1 plate", "plate", 300]], aliases: ["biryani"], popularity: 85 },
  { name: "Veg biryani", category: "Grains", source: "ESTIMATED", n: [150, 3.5, 24, 4.5, 1.6], servings: [["1 plate", "plate", 300]], aliases: ["biryani", "veg pulao"], popularity: 65 },
  { name: "Khichdi", category: "Grains", source: "ESTIMATED", n: [120, 4.3, 19, 3, 2], servings: [["1 katori", "katori", 200]], popularity: 60 },
  { name: "Curd rice", category: "Grains", source: "ESTIMATED", n: [120, 3.5, 18, 3.5, 0.6], servings: [["1 katori", "katori", 200]], aliases: ["thayir sadam", "dahi chawal"], popularity: 50 },
  { name: "Samosa", category: "Snacks", source: "ESTIMATED", n: [308, 5, 32, 18, 2.5], servings: [["1 samosa", "piece", 60]], popularity: 70 },
  { name: "Gulab jamun", category: "Sweets", source: "ESTIMATED", n: [320, 5, 48, 13, 0.5], servings: [["1 piece", "piece", 40]], popularity: 45 },
  { name: "Masala chai", category: "Drinks", source: "ESTIMATED", basis: "PER_100ML", density: 1.03, n: [50, 1.6, 7.5, 1.6, 0], servings: [["1 cup", "cup", 155]], aliases: ["chai", "tea with milk"], popularity: 90, note: "With toned milk and 1 tsp sugar per cup." },
  { name: "Sweet lassi", category: "Drinks", source: "ESTIMATED", basis: "PER_100ML", density: 1.04, n: [88, 3, 13, 2.8, 0], servings: [["1 glass", "glass", 260]], aliases: ["lassi"], popularity: 45 },
  { name: "Buttermilk", category: "Drinks", source: "ESTIMATED", basis: "PER_100ML", density: 1.02, n: [20, 1.2, 1.9, 0.9, 0], servings: [["1 glass", "glass", 255]], aliases: ["chaas", "chhaas", "mattha"], popularity: 50 },

  // ── Dairy & protein ────────────────────────────────────────────────────────
  { name: "Paneer", category: "Dairy", source: "ESTIMATED", n: [265, 18.3, 1.2, 20.8, 0], servings: [["1 cube", "piece", 25], ["1 katori", "katori", 100]], aliases: ["cottage cheese"], popularity: 90, note: "Typical full-fat paneer; brands vary." },
  { name: "Curd (dahi)", category: "Dairy", source: "USDA", n: [61, 3.5, 4.7, 3.3, 0], servings: [["1 katori", "katori", KATORI]], aliases: ["dahi", "yogurt", "plain yogurt"], popularity: 85, note: "USDA plain whole-milk yogurt." },
  { name: "Greek yogurt, plain nonfat", category: "Dairy", source: "USDA", n: [59, 10.2, 3.6, 0.4, 0], servings: [["1 cup", "cup", 170]], aliases: ["hung curd"], popularity: 60 },
  { name: "Greek yogurt, plain whole milk", category: "Dairy", source: "USDA", n: [97, 9, 4, 5, 0], servings: [["1 cup", "cup", 170]], popularity: 45 },
  { name: "Whole milk", category: "Dairy", source: "USDA", density: 1.03, n: [61, 3.2, 4.8, 3.3, 0], servings: [["1 glass", "glass", 257]], aliases: ["doodh", "full cream milk"], popularity: 80 },
  { name: "Toned milk", category: "Dairy", source: "ESTIMATED", basis: "PER_100ML", density: 1.03, n: [58, 3.1, 4.7, 3, 0], servings: [["1 glass", "glass", 257]], aliases: ["doodh"], popularity: 75 },
  { name: "Egg, whole, boiled", category: "Protein", source: "USDA", n: [155, 12.6, 1.1, 10.6, 0], servings: [["1 large egg", "piece", 50]], aliases: ["anda", "boiled egg"], popularity: 90 },
  { name: "Egg white", category: "Protein", source: "USDA", n: [52, 10.9, 0.7, 0.2, 0], servings: [["1 large egg white", "piece", 33]], popularity: 60 },
  { name: "Chicken breast, cooked", category: "Protein", source: "USDA", n: [165, 31, 0, 3.6, 0], servings: [["1 piece", "piece", 120]], aliases: ["grilled chicken"], popularity: 85 },
  { name: "Chicken breast, raw", category: "Protein", source: "USDA", n: [120, 22.5, 0, 2.6, 0], popularity: 60 },
  { name: "Salmon, cooked", category: "Protein", source: "USDA", n: [206, 22.1, 0, 12.4, 0], servings: [["1 fillet", "piece", 150]], popularity: 35 },
  { name: "Tofu, firm", category: "Protein", source: "USDA", n: [144, 17.3, 2.8, 8.7, 2.3], servings: [["1 slice", "slice", 85]], popularity: 60 },
  { name: "Soya chunks (dry)", category: "Protein", source: "ESTIMATED", n: [345, 52, 33, 0.5, 13], servings: [["1 katori (dry)", "katori", 30]], aliases: ["soy chunks", "nutrela", "meal maker"], popularity: 60 },
  { name: "Lentils, cooked", category: "Protein", source: "USDA", n: [116, 9, 20.1, 0.4, 7.9], servings: [["1 katori", "katori", KATORI]], aliases: ["masoor"], popularity: 50 },
  { name: "Chickpeas, cooked", category: "Protein", source: "USDA", n: [164, 8.9, 27.4, 2.6, 7.6], servings: [["1 katori", "katori", KATORI]], aliases: ["kabuli chana", "chana"], popularity: 55 },
  { name: "Kidney beans, cooked", category: "Protein", source: "USDA", n: [127, 8.7, 22.8, 0.5, 6.4], servings: [["1 katori", "katori", KATORI]], aliases: ["rajma"], popularity: 40 },
  { name: "Moong sprouts", category: "Protein", source: "USDA", n: [30, 3, 5.9, 0.2, 1.8], servings: [["1 katori", "katori", 100]], aliases: ["sprouts", "mung bean sprouts"], popularity: 50 },
  { name: "Whey protein (generic)", category: "Protein", source: "ESTIMATED", n: [400, 78, 8, 6, 0], servings: [["1 scoop", "scoop", 32]], aliases: ["protein powder"], popularity: 55, note: "Generic whey concentrate; use your brand's label for accuracy." },

  // ── Nuts, grains, breads ───────────────────────────────────────────────────
  { name: "Rolled oats (dry)", category: "Cereals", source: "USDA", n: [379, 13.2, 67.7, 6.5, 10.1], servings: [["1/2 cup", "cup", 40]], aliases: ["oats", "oatmeal"], popularity: 80 },
  { name: "Whole wheat flour", category: "Grains", source: "USDA", n: [340, 13.2, 72, 2.5, 10.7], aliases: ["atta"], popularity: 40 },
  { name: "White bread", category: "Breads", source: "USDA", n: [266, 8.9, 49, 3.3, 2.7], servings: [["1 slice", "slice", 25]], popularity: 50 },
  { name: "Whole wheat bread", category: "Breads", source: "USDA", n: [252, 12.4, 42.7, 3.5, 6], servings: [["1 slice", "slice", 28]], aliases: ["brown bread"], popularity: 55 },
  { name: "Almonds", category: "Nuts & seeds", source: "USDA", n: [579, 21.2, 21.6, 49.9, 12.5], servings: [["1 almond", "piece", 1.2], ["1 handful", "serving", 28]], aliases: ["badam"], popularity: 65 },
  { name: "Peanuts", category: "Nuts & seeds", source: "USDA", n: [567, 25.8, 16.1, 49.2, 8.5], servings: [["1 handful", "serving", 28]], aliases: ["moongphali", "groundnuts"], popularity: 55 },
  { name: "Walnuts", category: "Nuts & seeds", source: "USDA", n: [654, 15.2, 13.7, 65.2, 6.7], servings: [["1 half", "piece", 2]], aliases: ["akhrot"], popularity: 35 },
  { name: "Chia seeds", category: "Nuts & seeds", source: "USDA", n: [486, 16.5, 42.1, 30.7, 34.4], servings: [["1 tbsp", "serving", 12]], popularity: 35 },

  // ── Fruits (USDA, raw) ─────────────────────────────────────────────────────
  { name: "Banana", category: "Fruits", source: "USDA", n: [89, 1.1, 22.8, 0.3, 2.6], servings: [["1 medium", "piece", 118]], aliases: ["kela"], popularity: 90 },
  { name: "Apple", category: "Fruits", source: "USDA", n: [52, 0.3, 13.8, 0.2, 2.4], servings: [["1 medium", "piece", 182]], aliases: ["seb"], popularity: 80 },
  { name: "Mango", category: "Fruits", source: "USDA", n: [60, 0.8, 15, 0.4, 1.6], servings: [["1 cup sliced", "cup", 165]], aliases: ["aam"], popularity: 75 },
  { name: "Orange", category: "Fruits", source: "USDA", n: [47, 0.9, 11.8, 0.1, 2.4], servings: [["1 medium", "piece", 131]], aliases: ["santra"], popularity: 60 },
  { name: "Papaya", category: "Fruits", source: "USDA", n: [43, 0.5, 10.8, 0.3, 1.7], servings: [["1 cup cubes", "cup", 145]], popularity: 55 },
  { name: "Guava", category: "Fruits", source: "USDA", n: [68, 2.6, 14.3, 1, 5.4], servings: [["1 fruit", "piece", 55]], aliases: ["amrood"], popularity: 50 },
  { name: "Pomegranate seeds", category: "Fruits", source: "USDA", n: [83, 1.7, 18.7, 1.2, 4], servings: [["1/2 cup", "cup", 87]], aliases: ["anar"], popularity: 45 },
  { name: "Grapes", category: "Fruits", source: "USDA", n: [69, 0.7, 18.1, 0.2, 0.9], servings: [["1 cup", "cup", 151]], aliases: ["angoor"], popularity: 45 },
  { name: "Watermelon", category: "Fruits", source: "USDA", n: [30, 0.6, 7.6, 0.2, 0.4], servings: [["1 cup diced", "cup", 152]], aliases: ["tarbooz"], popularity: 45 },
  { name: "Dates", category: "Fruits", source: "USDA", n: [282, 2.5, 75, 0.4, 8], servings: [["1 date", "piece", 7]], aliases: ["khajur"], popularity: 45 },

  // ── Vegetables (USDA) ──────────────────────────────────────────────────────
  { name: "Spinach, raw", category: "Vegetables", source: "USDA", n: [23, 2.9, 3.6, 0.4, 2.2], servings: [["1 cup", "cup", 30]], aliases: ["palak"], popularity: 50 },
  { name: "Tomato", category: "Vegetables", source: "USDA", n: [18, 0.9, 3.9, 0.2, 1.2], servings: [["1 medium", "piece", 123]], aliases: ["tamatar"], popularity: 55 },
  { name: "Onion", category: "Vegetables", source: "USDA", n: [40, 1.1, 9.3, 0.1, 1.7], servings: [["1 medium", "piece", 110]], aliases: ["pyaz", "kanda"], popularity: 45 },
  { name: "Potato, boiled", category: "Vegetables", source: "USDA", n: [87, 1.9, 20.1, 0.1, 1.8], servings: [["1 medium", "piece", 150]], aliases: ["aloo"], popularity: 55 },
  { name: "Sweet potato, baked", category: "Vegetables", source: "USDA", n: [90, 2, 20.7, 0.2, 3.3], servings: [["1 medium", "piece", 114]], aliases: ["shakarkandi"], popularity: 40 },
  { name: "Cucumber", category: "Vegetables", source: "USDA", n: [15, 0.7, 3.6, 0.1, 0.5], servings: [["1 cup sliced", "cup", 104]], aliases: ["kheera", "kakdi"], popularity: 50 },
  { name: "Carrot", category: "Vegetables", source: "USDA", n: [41, 0.9, 9.6, 0.2, 2.8], servings: [["1 medium", "piece", 61]], aliases: ["gajar"], popularity: 45 },
  { name: "Broccoli", category: "Vegetables", source: "USDA", n: [34, 2.8, 6.6, 0.4, 2.6], servings: [["1 cup chopped", "cup", 91]], popularity: 45 },
  { name: "Cauliflower", category: "Vegetables", source: "USDA", n: [25, 1.9, 5, 0.3, 2], servings: [["1 cup", "cup", 107]], aliases: ["gobi", "phool gobi"], popularity: 40 },
  { name: "Okra", category: "Vegetables", source: "USDA", n: [33, 1.9, 7.5, 0.2, 3.2], servings: [["1 cup", "cup", 100]], aliases: ["bhindi", "lady finger"], popularity: 35 },
  { name: "Green peas", category: "Vegetables", source: "USDA", n: [81, 5.4, 14.5, 0.4, 5.7], servings: [["1/2 cup", "cup", 72]], aliases: ["matar"], popularity: 35 },
  { name: "Capsicum", category: "Vegetables", source: "USDA", n: [20, 0.9, 4.6, 0.2, 1.7], servings: [["1 medium", "piece", 119]], aliases: ["bell pepper", "shimla mirch"], popularity: 35 },

  // ── Oils, fats & sweeteners (USDA) ─────────────────────────────────────────
  { name: "Ghee", category: "Oils & fats", source: "USDA", density: 0.91, n: [876, 0.3, 0, 99.5, 0], servings: [["1 tsp", "tsp", 4.5], ["1 tbsp", "tbsp", 13.6]], aliases: ["clarified butter", "desi ghee"], popularity: 75 },
  { name: "Sunflower oil", category: "Oils & fats", source: "USDA", density: 0.92, n: [884, 0, 0, 100, 0], servings: [["1 tsp", "tsp", 4.6], ["1 tbsp", "tbsp", 13.8]], aliases: ["cooking oil", "refined oil", "vegetable oil"], popularity: 60 },
  { name: "Mustard oil", category: "Oils & fats", source: "USDA", density: 0.92, n: [884, 0, 0, 100, 0], servings: [["1 tsp", "tsp", 4.6], ["1 tbsp", "tbsp", 13.8]], aliases: ["sarson ka tel"], popularity: 45 },
  { name: "Coconut oil", category: "Oils & fats", source: "USDA", density: 0.92, n: [892, 0, 0, 99.1, 0], servings: [["1 tsp", "tsp", 4.5], ["1 tbsp", "tbsp", 13.6]], popularity: 40 },
  { name: "Olive oil", category: "Oils & fats", source: "USDA", density: 0.91, n: [884, 0, 0, 100, 0], servings: [["1 tsp", "tsp", 4.5], ["1 tbsp", "tbsp", 13.5]], popularity: 40 },
  { name: "Butter", category: "Oils & fats", source: "USDA", n: [717, 0.9, 0.1, 81.1, 0], servings: [["1 tsp", "serving", 5], ["1 tbsp", "serving", 14]], aliases: ["makhan"], popularity: 50 },
  { name: "Sugar", category: "Sweeteners", source: "USDA", density: 0.85, n: [387, 0, 100, 0, 0], servings: [["1 tsp", "tsp", 4.2]], aliases: ["cheeni", "shakkar"], popularity: 60 },
  { name: "Honey", category: "Sweeteners", source: "USDA", density: 1.42, n: [304, 0.3, 82.4, 0, 0.2], servings: [["1 tsp", "tsp", 7], ["1 tbsp", "tbsp", 21]], aliases: ["shahad"], popularity: 40 },
  { name: "Jaggery", category: "Sweeteners", source: "ESTIMATED", n: [383, 0.4, 98, 0.1, 0], servings: [["1 piece", "piece", 10]], aliases: ["gur", "gud"], popularity: 35 },

  // ── Packaged products (sample data, not verified against labels) ───────────
  { name: "High Protein Chocolate Oats", brand: "Yoga Bar", category: "Cereals", source: "SAMPLE", n: [350, 26, 48, 6, 9], servings: [["1 serving (40 g)", "serving", 40]], popularity: 40 },
  { name: "Malai Paneer", brand: "Amul", category: "Dairy", source: "SAMPLE", n: [290, 18, 3, 23, 0], servings: [["1 cube", "piece", 25]], popularity: 50 },
  { name: "Taaza Toned Milk", brand: "Amul", category: "Dairy", source: "SAMPLE", basis: "PER_100ML", density: 1.03, n: [58, 3, 4.7, 3, 0], servings: [["1 glass", "glass", 257]], popularity: 45 },
  { name: "Masti Dahi", brand: "Amul", category: "Dairy", source: "SAMPLE", n: [70, 3.5, 5, 4, 0], servings: [["1 katori", "katori", KATORI]], popularity: 35 },
  { name: "Pasteurised Butter", brand: "Amul", category: "Oils & fats", source: "SAMPLE", n: [722, 0.5, 0.5, 80, 0], servings: [["1 tsp", "serving", 5]], popularity: 40 },
  { name: "Gold Whey Protein", brand: "Nutrabay", category: "Supplements", source: "SAMPLE", n: [390, 76, 9, 5, 0], servings: [["1 scoop (33 g)", "scoop", 33]], popularity: 35 },
  { name: "Biozyme Performance Whey", brand: "MuscleBlaze", category: "Supplements", source: "SAMPLE", n: [385, 75, 10, 5, 0.5], servings: [["1 scoop (33 g)", "scoop", 33]], popularity: 35 },
  { name: "Brown Bread", brand: "Britannia", category: "Breads", source: "SAMPLE", n: [250, 8.5, 46, 3, 4.5], servings: [["1 slice", "slice", 25]], popularity: 35 },
  { name: "Marie Gold", brand: "Britannia", category: "Biscuits", source: "SAMPLE", n: [440, 8, 75, 12, 1.5], servings: [["1 biscuit", "piece", 6]], popularity: 35 },
  { name: "Parle-G", brand: "Parle", category: "Biscuits", source: "SAMPLE", n: [455, 6.5, 77, 13.5, 1], servings: [["1 biscuit", "piece", 6.25]], popularity: 35 },
  { name: "2-Minute Masala Noodles", brand: "Maggi", category: "Instant food", source: "SAMPLE", n: [430, 8.5, 62, 16, 2], servings: [["1 pack (70 g)", "serving", 70]], popularity: 45 },
  { name: "Aloo Bhujia", brand: "Haldiram's", category: "Snacks", source: "SAMPLE", n: [575, 10, 41, 41, 3], servings: [["1 handful", "serving", 25]], popularity: 30 },
  { name: "Corn Flakes Original", brand: "Kellogg's", category: "Cereals", source: "SAMPLE", n: [380, 7, 85, 0.6, 3], servings: [["1 bowl (30 g)", "serving", 30]], popularity: 35 },
  { name: "Masala Oats", brand: "Saffola", category: "Cereals", source: "SAMPLE", n: [385, 11, 62, 10, 8], servings: [["1 pack (40 g)", "serving", 40]], popularity: 35 },
  { name: "Greek Yogurt Natural", brand: "Epigamia", category: "Dairy", source: "SAMPLE", n: [90, 8, 5, 4.5, 0], servings: [["1 cup (90 g)", "serving", 90]], popularity: 35 },
  { name: "Classic Salted Chips", brand: "Lay's", category: "Snacks", source: "SAMPLE", n: [545, 6.5, 52, 34, 3.5], servings: [["1 small pack (26 g)", "serving", 26]], popularity: 35 },
  { name: "Peanut Butter Crunchy", brand: "Pintola", category: "Spreads", source: "SAMPLE", n: [620, 28, 17, 49, 7], servings: [["1 tbsp (16 g)", "serving", 16]], popularity: 35 },
  { name: "Idli Dosa Batter", brand: "iD Fresh", category: "Breakfast", source: "SAMPLE", n: [135, 4, 28, 0.5, 1.5], servings: [["1 idli's worth", "serving", 45]], popularity: 25 },
  { name: "Coca-Cola", brand: "Coca-Cola", category: "Drinks", source: "SAMPLE", basis: "PER_100ML", density: 1.04, n: [42, 0, 10.6, 0, 0], servings: [["1 can (300 ml)", "serving", 312]], popularity: 30 },
  { name: "Tomato Ketchup", brand: "Kissan", category: "Condiments", source: "SAMPLE", n: [120, 1, 29, 0.1, 0.5], servings: [["1 tbsp", "serving", 15]], popularity: 30 },
];
