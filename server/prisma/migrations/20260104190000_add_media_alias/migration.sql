-- CreateTable
CREATE TABLE "MediaAlias" (
    "aliasId" TEXT NOT NULL,
    "canonicalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAlias_pkey" PRIMARY KEY ("aliasId")
);

-- CreateIndex
CREATE INDEX "MediaAlias_canonicalId_idx" ON "MediaAlias"("canonicalId");

-- AddForeignKey
ALTER TABLE "MediaAlias" ADD CONSTRAINT "MediaAlias_canonicalId_fkey"
FOREIGN KEY ("canonicalId") REFERENCES "MediaReference"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
