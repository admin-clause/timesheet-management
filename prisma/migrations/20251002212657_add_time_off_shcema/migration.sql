-- CreateEnum
CREATE TYPE "public"."LeaveType" AS ENUM ('SICK', 'VACATION');

-- CreateEnum
CREATE TYPE "public"."TimeOffEntryKind" AS ENUM ('ACCRUAL', 'USAGE', 'ADJUSTMENT');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "employmentStartDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."TimeOffBalance" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "public"."LeaveType" NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeOffBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TimeOffTransaction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "recordedById" INTEGER,
    "type" "public"."LeaveType" NOT NULL,
    "kind" "public"."TimeOffEntryKind" NOT NULL,
    "days" DECIMAL(5,2) NOT NULL,
    "effectiveDate" DATE NOT NULL,
    "periodStart" DATE,
    "periodEnd" DATE,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeOffTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TimeOffBalance_userId_type_key" ON "public"."TimeOffBalance"("userId", "type");

-- CreateIndex
CREATE INDEX "TimeOffTransaction_userId_type_effectiveDate_idx" ON "public"."TimeOffTransaction"("userId", "type", "effectiveDate");

-- AddForeignKey
ALTER TABLE "public"."TimeOffBalance" ADD CONSTRAINT "TimeOffBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TimeOffTransaction" ADD CONSTRAINT "TimeOffTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TimeOffTransaction" ADD CONSTRAINT "TimeOffTransaction_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
