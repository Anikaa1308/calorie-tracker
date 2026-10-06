import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a direct (non-pooled) connection. Hosted Postgres such as
    // Neon on Vercel provides it as DATABASE_URL_UNPOOLED; locally DATABASE_URL is enough.
    url: process.env["DATABASE_URL_UNPOOLED"] || process.env["DATABASE_URL"],
  },
});
