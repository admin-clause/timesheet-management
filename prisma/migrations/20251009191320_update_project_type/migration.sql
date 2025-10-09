/*
  Warnings:

  - The values [INTERNAL,CLIENT] on the enum `ProjectType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."ProjectType_new" AS ENUM ('CLIENT_WORK', 'INTERNAL_PRODUCT', 'GENERAL');
ALTER TABLE "public"."Project" ALTER COLUMN "projectType" DROP DEFAULT;
ALTER TABLE "public"."Project" ALTER COLUMN "projectType" TYPE "public"."ProjectType_new" USING ("projectType"::text::"public"."ProjectType_new");
ALTER TYPE "public"."ProjectType" RENAME TO "ProjectType_old";
ALTER TYPE "public"."ProjectType_new" RENAME TO "ProjectType";
DROP TYPE "public"."ProjectType_old";
ALTER TABLE "public"."Project" ALTER COLUMN "projectType" SET DEFAULT 'GENERAL';
COMMIT;

-- AlterTable
ALTER TABLE "public"."Project" ALTER COLUMN "projectType" SET DEFAULT 'GENERAL';
