-- DropIndex
DROP INDEX "Food_searchText_trgm_idx";

-- AlterTable
ALTER TABLE "MealItem" ADD COLUMN     "deletedAt" TIMESTAMP(3);
