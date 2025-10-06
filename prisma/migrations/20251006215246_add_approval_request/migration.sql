-- CreateEnum
CREATE TYPE "public"."ApprovalRequestType" AS ENUM ('TIME_OFF');

-- CreateEnum
CREATE TYPE "public"."ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."ApprovalRequest" (
    "id" SERIAL NOT NULL,
    "requestType" "public"."ApprovalRequestType" NOT NULL,
    "status" "public"."ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" INTEGER NOT NULL,
    "reviewedById" INTEGER,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "requesterNote" TEXT,
    "approverNote" TEXT,
    "metadata" JSONB,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TimeOffRequestDetails" (
    "id" SERIAL NOT NULL,
    "approvalRequestId" INTEGER NOT NULL,
    "requestedType" "public"."LeaveRequestType" NOT NULL,
    "storedType" "public"."LeaveType" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "partialStartDays" DECIMAL(4,2),
    "partialEndDays" DECIMAL(4,2),
    "totalDays" DECIMAL(5,2) NOT NULL,
    "overrideBalance" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TimeOffRequestDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApprovalRequest_requestType_status_submittedAt_idx" ON "public"."ApprovalRequest"("requestType", "status", "submittedAt");

-- CreateIndex
CREATE INDEX "ApprovalRequest_requestedById_status_idx" ON "public"."ApprovalRequest"("requestedById", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TimeOffRequestDetails_approvalRequestId_key" ON "public"."TimeOffRequestDetails"("approvalRequestId");

-- AddForeignKey
ALTER TABLE "public"."ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TimeOffRequestDetails" ADD CONSTRAINT "TimeOffRequestDetails_approvalRequestId_fkey" FOREIGN KEY ("approvalRequestId") REFERENCES "public"."ApprovalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
