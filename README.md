# Plate

A calm calorie and macro tracker built for everyday Indian eating (roti, dal, paneer, poha, packaged brands) that also handles international foods.

The product and engineering plan lives in [`docs/PLAN.md`](docs/PLAN.md).

## Run it locally

Requirements: Node 20.9+ and PostgreSQL 15+.

```bash
cp .env.example .env          # set DATABASE_URL (and AUTH_SECRET once auth lands)
npm install                   # also generates the Prisma client
npm run db:setup              # apply migrations and seed ~110 foods
npm run dev                   # http://localhost:3000
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Unit tests (calculation engine, units, goals, search ranking) |
| `npm run lint` / `npm run typecheck` | ESLint and TypeScript |
| `npm run db:migrate` / `npm run db:seed` | Apply migrations / (re)seed foods; seeding is idempotent |

## Where the numbers come from

- `src/lib/nutrition.ts` is the only place nutrition is calculated.
- `src/lib/goals.ts` estimates daily targets (Mifflin–St Jeor BMR × activity factor, goal adjustment, safety floor, then protein → fat → carbs).
- `src/lib/units.ts` converts quantities: grams, volume through density, and count units (1 roti, 1 scoop) only through a food's own servings.

Targets are estimates for general wellness, not medical advice.

## Food data

Seed foods (`prisma/seed-data.ts`) are labelled by source in the app:

- **USDA**: FoodData Central reference values.
- **Estimate**: home-style Indian dishes calculated from typical recipes; they vary by preparation.
- **Sample data**: packaged products not yet verified against the pack label. Replace with Open Food Facts or label values.
