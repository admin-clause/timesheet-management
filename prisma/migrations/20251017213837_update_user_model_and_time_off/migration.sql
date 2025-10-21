/*
  Warnings:

  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `employmentStartDate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[companyEmail]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[personalEmail]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."EmploymentType" AS ENUM ('PERMANENT', 'CONTRACT');

-- CreateEnum
CREATE TYPE "public"."EmployeeStatus" AS ENUM ('CITIZEN', 'PR', 'WORK_PERMIT', 'STUDENT_PERMIT');

-- DropIndex
DROP INDEX "public"."User_email_key";

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "email",
DROP COLUMN "employmentStartDate",
DROP COLUMN "name",
ADD COLUMN     "companyEmail" TEXT,
ADD COLUMN     "employeeStatus" "public"."EmployeeStatus",
ADD COLUMN     "employmentType" "public"."EmploymentType",
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "fobNumber" TEXT,
ADD COLUMN     "initialSickLeaveGranted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "midProbationDate" TIMESTAMP(3),
ADD COLUMN     "personalEmail" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_companyEmail_key" ON "public"."User"("companyEmail");

-- CreateIndex
CREATE UNIQUE INDEX "User_personalEmail_key" ON "public"."User"("personalEmail");
