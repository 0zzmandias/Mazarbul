-- AlterTable
ALTER TABLE "MediaReference" ADD COLUMN     "countries" JSONB,
ADD COLUMN     "details" JSONB,
ADD COLUMN     "director" TEXT,
ADD COLUMN     "genres" JSONB,
ADD COLUMN     "runtime" INTEGER;
