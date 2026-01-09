/*
  Warnings:

  - The primary key for the `MediaAlias` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `aliasId` on the `MediaAlias` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `MediaAlias` table. All the data in the column will be lost.
  - Added the required column `id` to the `MediaAlias` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MediaAlias" DROP CONSTRAINT "MediaAlias_pkey",
DROP COLUMN "aliasId",
DROP COLUMN "updatedAt",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "MediaAlias_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "MediaReference" ADD COLUMN     "canonicalCountryIso2" TEXT,
ADD COLUMN     "canonicalCountryQid" TEXT,
ADD COLUMN     "canonicalCreatorName" TEXT,
ADD COLUMN     "canonicalCreatorQid" TEXT,
ADD COLUMN     "canonicalGenreKey" TEXT,
ADD COLUMN     "canonicalGenres" JSONB,
ADD COLUMN     "canonicalYear" INTEGER,
ADD COLUMN     "isStub" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastAccessedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "MediaReference_canonicalYear_idx" ON "MediaReference"("canonicalYear");

-- CreateIndex
CREATE INDEX "MediaReference_canonicalGenreKey_idx" ON "MediaReference"("canonicalGenreKey");

-- CreateIndex
CREATE INDEX "MediaReference_lastAccessedAt_idx" ON "MediaReference"("lastAccessedAt");

-- CreateIndex
CREATE INDEX "MediaReference_isStub_idx" ON "MediaReference"("isStub");
