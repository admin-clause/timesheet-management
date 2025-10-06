-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."LeaveType" ADD VALUE 'BEREAVEMENT';
ALTER TYPE "public"."LeaveType" ADD VALUE 'UNPAID';
ALTER TYPE "public"."LeaveType" ADD VALUE 'MILITARY';
ALTER TYPE "public"."LeaveType" ADD VALUE 'JURY_DUTY';
ALTER TYPE "public"."LeaveType" ADD VALUE 'PARENTAL';
ALTER TYPE "public"."LeaveType" ADD VALUE 'OTHER';
