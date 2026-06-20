-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "leadPersonId" TEXT;

-- CreateIndex
CREATE INDEX "Department_leadPersonId_idx" ON "Department"("leadPersonId");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_leadPersonId_fkey" FOREIGN KEY ("leadPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
