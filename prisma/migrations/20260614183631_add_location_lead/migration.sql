-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "leadPersonId" TEXT;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_leadPersonId_fkey" FOREIGN KEY ("leadPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
