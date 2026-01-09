/*
  Warnings:

  - You are about to drop the column `canonicalCountryIso2` on the `MediaReference` table. All the data in the column will be lost.
  - You are about to drop the column `canonicalCountryQid` on the `MediaReference` table. All the data in the column will be lost.
  - You are about to drop the column `canonicalCreatorName` on the `MediaReference` table. All the data in the column will be lost.
  - You are about to drop the column `canonicalCreatorQid` on the `MediaReference` table. All the data in the column will be lost.
  - You are about to drop the column `canonicalGenreKey` on the `MediaReference` table. All the data in the column will be lost.
  - You are about to drop the column `canonicalGenres` on the `MediaReference` table. All the data in the column will be lost.
  - You are about to drop the column `canonicalYear` on the `MediaReference` table. All the data in the column will be lost.
  - Added the required column `lang` to the `MediaAlias` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source` to the `MediaAlias` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `MediaAlias` table without a default value. This is not possible if the table is not empty.
  - Added the required column `titleNormalized` to the `MediaAlias` table without a default value. This is not possible if the table is not empty.
  - Added the required column `titleRaw` to the `MediaAlias` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `MediaAlias` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "MediaAlias_canonicalId_idx";

-- DropIndex
DROP INDEX "MediaReference_canonicalGenreKey_idx";

-- DropIndex
DROP INDEX "MediaReference_canonicalYear_idx";

-- DropIndex
DROP INDEX "MediaReference_isStub_idx";

-- AlterTable
ALTER TABLE "MediaAlias" ADD COLUMN     "lang" TEXT NOT NULL,
ADD COLUMN     "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "source" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "titleNormalized" TEXT NOT NULL,
ADD COLUMN     "titleRaw" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MediaReference" DROP COLUMN "canonicalCountryIso2",
DROP COLUMN "canonicalCountryQid",
DROP COLUMN "canonicalCreatorName",
DROP COLUMN "canonicalCreatorQid",
DROP COLUMN "canonicalGenreKey",
DROP COLUMN "canonicalGenres",
DROP COLUMN "canonicalYear",
ADD COLUMN     "countrySource" TEXT,
ADD COLUMN     "lastFetchedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Genre" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titles" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaGenre" (
    "mediaId" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaGenre_pkey" PRIMARY KEY ("mediaId","genreId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Genre_slug_key" ON "Genre"("slug");

-- CreateIndex
CREATE INDEX "MediaGenre_genreId_idx" ON "MediaGenre"("genreId");

-- CreateIndex
CREATE INDEX "MediaGenre_mediaId_idx" ON "MediaGenre"("mediaId");

-- CreateIndex
CREATE INDEX "MediaAlias_lastAccessedAt_idx" ON "MediaAlias"("lastAccessedAt");

-- CreateIndex
CREATE INDEX "MediaAlias_type_lang_titleNormalized_idx" ON "MediaAlias"("type", "lang", "titleNormalized");

-- CreateIndex
CREATE INDEX "MediaReference_type_releaseYear_idx" ON "MediaReference"("type", "releaseYear");

-- AddForeignKey
ALTER TABLE "MediaGenre" ADD CONSTRAINT "MediaGenre_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaReference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaGenre" ADD CONSTRAINT "MediaGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;
