/*
  Warnings:

  - You are about to drop the column `date` on the `TaskEntry` table. All the data in the column will be lost.
  - You are about to drop the column `hours` on the `TaskEntry` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,projectId,taskName,weekStartDate]` on the table `TaskEntry` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `weekStartDate` to the `TaskEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."TaskEntry" DROP COLUMN "date",
DROP COLUMN "hours",
ADD COLUMN     "hoursFri" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "hoursMon" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "hoursThu" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "hoursTue" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "hoursWed" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "weekStartDate" DATE NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "TaskEntry_userId_projectId_taskName_weekStartDate_key" ON "public"."TaskEntry"("userId", "projectId", "taskName", "weekStartDate");
