-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactMobile" TEXT,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "organisationName" TEXT,
ADD COLUMN     "organisationalUnit" TEXT;

-- AlterTable
ALTER TABLE "LocationAddress" ADD COLUMN     "additionalInfo" TEXT,
ADD COLUMN     "area" TEXT,
ADD COLUMN     "building" TEXT,
ADD COLUMN     "floor" TEXT,
ADD COLUMN     "room" TEXT;
