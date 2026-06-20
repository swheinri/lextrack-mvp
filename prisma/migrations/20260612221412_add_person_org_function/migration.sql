-- CreateEnum
CREATE TYPE "OrgFunction" AS ENUM ('MEMBER', 'LEAD', 'DEPUTY');

-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "orgFunction" "OrgFunction" NOT NULL DEFAULT 'MEMBER';

-- CreateIndex
CREATE INDEX "Person_teamId_orgFunction_idx" ON "Person"("teamId", "orgFunction");

-- CreateIndex
CREATE INDEX "Person_departmentId_orgFunction_idx" ON "Person"("departmentId", "orgFunction");
