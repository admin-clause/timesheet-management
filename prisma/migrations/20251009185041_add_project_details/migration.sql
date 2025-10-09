/*
  Warnings:

  - A unique constraint covering the columns `[projectCode]` on the table `Project` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."ProjectStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."ProjectType" AS ENUM ('INTERNAL', 'CLIENT');

-- AlterTable
ALTER TABLE "public"."Project" ADD COLUMN     "clientName" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "projectCode" TEXT,
ADD COLUMN     "projectType" "public"."ProjectType" NOT NULL DEFAULT 'INTERNAL',
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "status" "public"."ProjectStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE UNIQUE INDEX "Project_projectCode_key" ON "public"."Project"("projectCode");
