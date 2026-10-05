# Plate — product & engineering plan

Plate is a calorie and macro tracker built for everyday Indian eating (roti, dal, paneer, poha, packaged brands) that also handles international foods. This document is the plan the code follows. It is updated as phases land.

---

## 1. Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js 16 (App Router)**, React 19, TypeScript | Server components for fast first paint, route handlers for the API, one deployable unit. |
| Styling | **Tailwind CSS v4** with CSS-variable design tokens | Tokens give light/dark themes for free and keep the palette in one place. |
| UI primitives | **Radix UI** primitives wrapped in our own `components/ui` (shadcn-style, hand-owned) | Accessible dialogs, selects, tabs, focus management; visual style stays ours. |
| Icons | **Lucide** | Thin, consistent strokes; used sparingly. |
| Charts | **Recharts** | History trends and weight graph. |
| Data fetching | **TanStack Query** | Caching, optimistic updates for logging, undo on delete. |
| Validation | **Zod** | One schema validates on both client forms and server route handlers. |
| Database | **PostgreSQL 17** | Relational data, `pg_trgm` for fuzzy food search. |
| ORM | **Prisma 7** with the `pg` driver adapter | Typed queries, migrations, seed script. |
| Auth | **Auth.js (NextAuth v5)**: email + password (bcrypt) and Google OAuth | JWT sessions; Google is enabled only when its env vars exist. |
| Tests | **Vitest** | Calculation engine, unit conversion, goal math, search ranking. |

## 2. Architecture

```
Browser (React client components)
  │  TanStack Query hooks (lib/queries/*)
  ▼
Next.js route handlers  /api/*        ← auth check + Zod validation + rate limit
  │
  ├── services/            business logic (diary, goals, foods, recipes, weight)
  │     └── lib/nutrition  pure calculation engine (no I/O, fully unit-tested)
  ├── food-data/           provider abstraction
  │     ├── local          Postgres (seeded + user + cached foods)
  │     ├── openfoodfacts  products + barcodes (no key needed)
  │     ├── usda           FoodData Central (USDA_API_KEY)
  │     └── web-discovery  optional official search API — links only, never numbers
  └── Prisma → PostgreSQL
```

Rules the code follows:
- **One calculation engine.** `lib/nutrition.ts` owns every nutrition number shown in the UI: `calculateNutrition(food, quantity, unit)`, totals, and rounding. Components never multiply nutrients themselves.
- **Logged items are snapshots.** When a food is logged, its computed nutrients are stored on the meal item. Editing a food later never rewrites history.
- **Server owns the truth.** Clients send `{foodId, quantity, unit}`; the server recomputes nutrition with the same engine before saving.
- **Pages stay thin.** Each route composes feature components (`components/meals`, `components/food-search`, …) and hooks; no page file grows into a giant component.

## 3. Database schema (Prisma)

| Model | Purpose / key fields |
| --- | --- |
| `User` | id, email, passwordHash?, name, image. Auth.js `Account` + `VerificationToken` alongside. |
| `Profile` | userId, sex, birthDate, heightCm, weightKg (current), goalWeightKg, activityLevel, goal, rate, unit prefs (`weightUnit`, `heightUnit`), theme, onboardedAt. |
| `DailyGoal` | userId, effectiveFrom (date), calories, protein, carbs, fat, fiber, `isCustom`, plus the recommended values at the time. A new row each time goals change, so history compares against the goal that applied that day. |
| `Brand` | id, name, slug. |
| `Food` | id, name, brandId?, category, kind (`GENERIC`/`BRANDED`/`USER`/`RECIPE`), basis (`PER_100G` / `PER_100ML`), densityGPerMl?, source (`USDA`, `OPEN_FOOD_FACTS`, `IFCT`, `PRODUCT_LABEL`, `USER`, `ESTIMATED`, `SAMPLE`), confidence (`VERIFIED`/`HIGH`/`MEDIUM`/`LOW`), externalId?, barcode?, ownerId? (null = shared), popularity, searchText. |
| `FoodNutrition` | foodId (1:1), per-100 basis: calories, protein, carbs, fat, fiber, sugar?, saturatedFat?, sodiumMg?. |
| `FoodServing` | foodId, label ("1 roti", "1 cup", "1 scoop"), unit (`piece`, `cup`, `bowl`…), grams, isDefault. |
| `CustomFood` | Implemented as `Food` rows with `kind = USER` and `ownerId` set, so custom foods flow through the same search and calculation paths (no duplicate logic). |
| `Recipe` | id, ownerId, name, servings, totalWeightG?, notes, foodId (the generated `Food` of kind `RECIPE` that gets logged). |
| `RecipeIngredient` | recipeId, foodId, quantity, unit, grams (resolved), position. |
| `Meal` | userId, date (calendar date), type (`BREAKFAST`/`LUNCH`/`DINNER`/`SNACKS`). Unique per user/date/type. |
| `MealItem` | mealId, foodId, quantity, unit, grams, snapshot calories/protein/carbs/fat/fiber, foodName + brand snapshot, createdAt. |
| `DailyNutrition` | userId, date, totals (calories…fiber), itemCount. Maintained on every diary write; history charts read this table, not the raw items. |
| `WeightEntry` | userId, date, weightKg, note. Unique per user/date. |
| `FavoriteFood` | userId, foodId. |
| `FoodHistory` | userId, foodId, timesLogged, lastUsedAt, lastQuantity, lastUnit. Powers Recent / Frequent and one-click re-add with the last amount. |

## 4. Nutrition-data strategy

**Never invent numbers.** Every food has a `source` and `confidence`, and the UI shows it ("Nutrition data: USDA", "Product label", "User added", "Estimate").

Search pipeline (`food-data/search.ts`):
1. **Local database first** (instant): seeded foods, the user's own foods/recipes, and any external foods previously imported. Uses Postgres `pg_trgm` similarity + prefix matching.
2. **External providers in parallel**, only when local results are thin or the query looks branded: Open Food Facts (search + barcode, strong Indian packaged coverage), USDA FoodData Central (generic foods, needs `USDA_API_KEY`). Results are normalised to our per-100 g shape. A product with missing core nutrients is shown as "Nutrition information isn't available" and cannot be logged without the user filling it in.
3. **Import on use.** An external result is written to `Food` only when someone opens or logs it, so the database grows with real usage and search stays fast.
4. **Web discovery fallback (optional).** If `SEARCH_API_KEY` is configured, a "Look it up" action uses an official search API to show links to the brand's page. It never extracts numbers automatically; the user can create a custom food from the label.
5. **Caching.** Provider responses cached in memory (LRU, 10 min) server-side; TanStack Query caches per query on the client; input is debounced (200 ms).

Ranking (`lib/food-search.ts`, unit-tested): exact product name → exact brand match → name starts with the query → token match → category match → popularity → the user's own history boosts recent/frequent foods.

Seed data: Indian staples from published Indian food composition values (IFCT 2017 / NIN) and USDA reference values, each tagged with its source. Branded items without verifiable label data are marked `SAMPLE` and labelled "Sample data" in the UI.

## 5. Goal & macro methodology (`lib/goals.ts`)

All numbers are labelled **estimates**, not medical advice.

1. **BMR (Mifflin–St Jeor)**
   - Men: `10·kg + 6.25·cm − 5·age + 5`
   - Women: `10·kg + 6.25·cm − 5·age − 161`
2. **TDEE** = BMR × activity factor: sedentary 1.2 · light 1.375 · moderate 1.55 · very 1.725 · extreme 1.9.
3. **Goal adjustment**
   - Lose: slow −10 %, moderate −15 %, aggressive −20 % of TDEE, with the deficit capped at 750 kcal/day.
   - Maintain: TDEE. Recomposition: −5 %. Gain: +10 %. Build muscle: +7.5 % (lean bulk).
   - **Safety floor:** never below max(BMR, 1,200 kcal for women / 1,500 kcal for men). If the floor kicks in, the UI says so.
   - Rounded to the nearest 10 kcal.
4. **Protein** (g per kg of reference weight): lose 2.0 · maintain 1.6 · recomp 2.0 · gain 1.6 · build muscle 2.0; +0.2 when very/extremely active. Reference weight = body weight, or the weight at BMI 25 when BMI > 30 (avoids absurd targets). Capped at 35 % of calories.
5. **Fat**: max(25 % of calories, 0.6 g/kg).
6. **Carbs**: the remaining calories ÷ 4. If that would go below 50 g, fat drops toward its 0.6 g/kg floor first.
7. **Fiber**: 14 g per 1,000 kcal (IOM guideline), minimum 25 g.
8. Consistency check (tested): `protein·4 + carbs·4 + fat·9` is within ±10 kcal of the calorie target.

Manual edits: the Edit Goals sheet shows *Recommended* next to *Your target*. Changing calories or one macro offers **"Rebalance the other macros"** or **"Keep my other targets"**; nothing is overwritten silently.

## 6. Units & quantities (`lib/units.ts`)

- Mass: g, kg. Volume: ml, l, cup (240 ml), tbsp (15 ml), tsp (5 ml); volume converts to grams through the food's density (liquids default to 1 g/ml; oils 0.91; ghee 0.91; flours have their own).
- Count units (piece, serving, slice, bowl, scoop) resolve only through that food's `FoodServing` rows, so a unit is offered only when its conversion is known.
- Fractions: quantity accepts decimals and fractions (`5/6`, `1 1/2`), parsed by `parseQuantity`.
- Rounding (`formatNutrient`): kcal → whole number, macros → 1 decimal, trailing `.0` hidden.

## 7. Pages & components

```
src/app
  page.tsx                 Landing ("Know what you eat.")
  (auth)/sign-in, sign-up
  onboarding/              4-step profile + goals flow
  (app)/layout.tsx         Sidebar (desktop) / bottom nav (mobile)
  (app)/today/             Daily tracker  ← core screen
  (app)/search/            Food search (also opens as a sheet from "Add food")
  (app)/history/           Trends 7/30/90 days + weight
  (app)/recipes/           Recipe list + builder
  (app)/foods/             My foods, favorites, recent
  (app)/profile/           Body data, goals, Edit Goals
  (app)/settings/          Units, theme, export, delete account
  api/…                    route handlers

src/components
  ui/          button, input, dialog/sheet, tabs, select, progress, toast…
  nutrition/   CalorieSummary, MacroBar, RemainingList, SourceBadge, NutritionTable
  food-search/ SearchInput, ResultList, ResultRow, FoodDetailSheet, QuantityPicker
  meals/       MealSection, MealItemRow, DayNavigator, DaySummary
  charts/      TrendChart, WeightChart
  layout/      AppSidebar, MobileNav, PageHeader

src/lib
  nutrition.ts  goals.ts  units.ts  food-search.ts  dates.ts  format.ts
  queries/      TanStack Query hooks
src/server
  db.ts  auth.ts  services/*  food-data/*
```

## 8. Design system

Calm, warm, trustworthy. Typography and whitespace carry the hierarchy; cards are used only when grouping is real.

- **Colour** (tokens on `:root`, dark-mode overrides):
  - Background `#F7F6F2` warm off-white · Surface `#FFFFFF` · Subtle `#F0EEE8` · Border `#E4E1D9`
  - Text `#1E1D1A` charcoal · Muted `#6B675F` · Faint `#9A958B`
  - Accent `#3D6B4F` muted forest green (calories, primary actions) · Accent soft `#E6EEE8`
  - Macros, desaturated so charts stay quiet: Protein `#3D6B4F` · Carbs `#B98A3E` ochre · Fat `#A9634B` clay · Fiber `#5A7486` slate
  - Status: *near target* uses the accent; *over target* uses a soft amber `#B7791F` text + small marker, never alarm red, and a ±5 % band counts as on target. Status is always also written in words ("12 g over").
  - Dark: background `#121211`, surface `#1A1A18`, border `#2A2926`, text `#ECE9E3`, accent `#86B394`.
- **Type**: Geist Sans; numbers use tabular figures. Scale 12 / 13 / 14 / 16 / 20 / 28 / 40. Section labels are 12 px uppercase with letter-spacing, muted.
- **Shape**: radius 8 px controls, 12 px sheets/panels; 1 px borders; one soft shadow reserved for floating sheets.
- **Motion**: 150–200 ms ease-out; a subtle row highlight on add; undo toasts instead of confirm dialogs.
- **Layout**: desktop 240 px sidebar + 720 px content column (wide screens get a right rail for the day summary); mobile bottom nav (Today · Search · Add · History · Profile) with a centre Add button that opens the meal picker.
- **Accessibility**: visible focus rings (accent, 2 px offset), labelled inputs, `aria-live` for totals and toasts, progress bars with `role="progressbar"` + text values, contrast ≥ 4.5:1.

## 9. Implementation roadmap

Each phase ends with a runnable app, passing tests, a commit, and a push.

1. **Foundation** — scaffold, design tokens, UI primitives, nutrition/units/goals engines with tests.
2. **Data** — Prisma schema, migrations, seed (30+ Indian foods, 20 packaged, 10 fruits, 10 vegetables, 10 protein sources, oils/ghee), local search with ranking.
3. **Core logging** — `/today` with day navigation, calorie + macro progress, meal sections, add-food sheet (search / recent / favorites / my foods / recipes), food detail with live quantity + unit maths, edit and delete with undo, daily summary and remaining.
4. **Profile & goals** — onboarding flow, goal calculation with explanations, Edit Goals with rebalance choice, profile page.
5. **Library & history** — custom foods, recipe builder (per-serving nutrition, oil as an ingredient), favorites/recent/frequent, `/history` charts with averages, weight tracking.
6. **Accounts & external data** — Auth.js (email/password + Google), protected routes, Open Food Facts + USDA providers, barcode lookup and camera scanning, settings (units, theme, export, delete account), rate limiting.
7. **Polish** — nutrition-label photo entry (OCR as an editable draft), responsive QA on phone/tablet/desktop, empty states, accessibility pass.

Until auth lands in phase 6, the app runs as a single local demo user so the logging experience can be built and used end to end.

## 10. Status (2026-10-05)

All seven phases are in `main`. Notes on where the build differs from the plan above:

- **Seed data**: Indian dishes are tagged `ESTIMATED` (typical recipes, labelled "Estimate"), not `IFCT`, because the IFCT 2017 tables weren't available to cite value by value. Generic ingredients use USDA reference values. Packaged products are `SAMPLE` until replaced by label or Open Food Facts data.
- **External providers** (Open Food Facts, USDA) are implemented and unit-tested against fixture payloads; live calls weren't reachable from the build environment, so they need a smoke test with real network access.
- **Label photo entry** runs Tesseract OCR in the browser (it downloads its language data from a CDN on first use) and only fills a draft the person checks.
- **Camera barcode scanning** uses the browser `BarcodeDetector`; other browsers type the number.
- Google sign-in links accounts by verified email without the Prisma adapter, keeping JWT sessions.
