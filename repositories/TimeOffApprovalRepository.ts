import { prisma } from '@/lib/prisma'
import {
  ApprovalRequest,
  ApprovalRequestType,
  ApprovalStatus,
  LeaveRequestType,
  LeaveType,
  Prisma,
  TimeOffEntryKind,
  TimeOffRequestDetails,
  TimeOffTransaction,
} from '@prisma/client'

const mapRequestedToStored = (requested: LeaveRequestType): { storedType: LeaveType; affectsBalance: boolean } => {
  if (requested === LeaveRequestType.SICK) {
    return { storedType: LeaveType.SICK, affectsBalance: true }
  }
  if (requested === LeaveRequestType.UNPAID) {
    return { storedType: LeaveType.VACATION, affectsBalance: false }
  }
  return { storedType: LeaveType.VACATION, affectsBalance: true }
}

export type CreateTimeOffRequestInput = {
  requestedById: number
  requestedType: LeaveRequestType
  periodStart: Date
  periodEnd: Date
  totalDays: number
  partialStartDays?: number | null
  partialEndDays?: number | null
  requesterNote?: string | null
  overrideBalance?: boolean
}

export async function createTimeOffRequest(input: CreateTimeOffRequestInput): Promise<ApprovalRequest> {
  const {
    requestedById,
    requestedType,
    periodStart,
    periodEnd,
    totalDays,
    partialStartDays,
    partialEndDays,
    requesterNote,
    overrideBalance,
  } = input

  return prisma.$transaction(async tx => {
    const { storedType } = mapRequestedToStored(requestedType)

    const approval = await tx.approvalRequest.create({
      data: {
        requestType: ApprovalRequestType.TIME_OFF,
        status: ApprovalStatus.PENDING,
        requestedById,
        requesterNote,
        timeOffDetails: {
          create: {
            requestedType,
            storedType,
            periodStart,
            periodEnd,
            totalDays: new Prisma.Decimal(totalDays),
            partialStartDays: partialStartDays != null ? new Prisma.Decimal(partialStartDays) : undefined,
            partialEndDays: partialEndDays != null ? new Prisma.Decimal(partialEndDays) : undefined,
            overrideBalance: overrideBalance ?? false,
          },
        },
      },
      include: {
        timeOffDetails: true,
      },
    })

    return approval
  })
}

export async function cancelTimeOffRequest(requestId: number, userId: number): Promise<ApprovalRequest> {
  return prisma.$transaction(async tx => {
    const existing = await tx.approvalRequest.findUnique({
      where: { id: requestId },
      include: { timeOffDetails: true },
    })

    if (!existing) {
      throw new Error('Request not found')
    }
    if (existing.requestedById !== userId) {
      throw new Error('Cannot cancel another user\'s request')
    }
    if (existing.status !== ApprovalStatus.PENDING) {
      throw new Error('Only pending requests can be cancelled')
    }

    return tx.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: ApprovalStatus.CANCELLED,
        decidedAt: new Date(),
      },
      include: { timeOffDetails: true },
    })
  })
}

type ApprovalActionResult = {
  approval: ApprovalRequest & { timeOffDetails: TimeOffRequestDetails | null }
  transaction?: TimeOffTransaction
}

export async function approveTimeOffRequest(options: {
  requestId: number
  approverId: number
  approverNote?: string | null
}): Promise<ApprovalActionResult> {
  const { requestId, approverId, approverNote } = options

  return prisma.$transaction(async tx => {
    const approval = await tx.approvalRequest.findUnique({
      where: { id: requestId },
      include: { timeOffDetails: true },
    })

    if (!approval) {
      throw new Error('Request not found')
    }
    if (approval.status !== ApprovalStatus.PENDING) {
      throw new Error('Only pending requests can be approved')
    }
    if (!approval.timeOffDetails) {
      throw new Error('Missing time-off details for request')
    }

    const details = approval.timeOffDetails
    const { storedType, affectsBalance } = mapRequestedToStored(details.requestedType)

    const shouldOverride = details.overrideBalance || !affectsBalance

    const transactionData = {
      userId: approval.requestedById,
      recordedById: approverId,
      requestedType: details.requestedType,
      kind: TimeOffEntryKind.USAGE,
      days: Number(details.totalDays),
      effectiveDate: details.periodStart,
      periodStart: details.periodStart,
      periodEnd: details.periodEnd,
      note: approverNote ?? undefined,
    }

    if (!shouldOverride && affectsBalance) {
      const balance = await tx.timeOffBalance.findUnique({
        where: {
          userId_type: {
            userId: approval.requestedById,
            type: storedType,
          },
        },
      })

      const current = balance?.balance ?? new Prisma.Decimal(0)
      const requested = new Prisma.Decimal(details.totalDays)

      if (current.sub(requested).lt(0)) {
        throw new Error('Insufficient leave balance for approval')
      }
    }

    const transaction = await tx.timeOffTransaction.create({
      data: {
        userId: transactionData.userId,
        recordedById: transactionData.recordedById,
        requestedType: details.requestedType,
        type: storedType,
        kind: TimeOffEntryKind.USAGE,
        days: affectsBalance ? new Prisma.Decimal(transactionData.days).neg() : new Prisma.Decimal(transactionData .days),
        effectiveDate: new Date(details.periodStart),
        periodStart: new Date(details.periodStart),
        periodEnd: new Date(details.periodEnd),
        note: transactionData.note ?? null,
      },
    })

    if (affectsBalance) {
      await tx.timeOffBalance.upsert({
        where: {
          userId_type: {
            userId: approval.requestedById,
            type: storedType,
          },
        },
        update: {
          balance: { decrement: new Prisma.Decimal(details.totalDays) },
        },
        create: {
          userId: approval.requestedById,
          type: storedType,
          balance: new Prisma.Decimal(0).minus(details.totalDays),
        },
      })
    }

    const updated = await tx.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: ApprovalStatus.APPROVED,
        reviewedById: approverId,
        decidedAt: new Date(),
        approverNote: approverNote ?? null,
      },
      include: { timeOffDetails: true },
    })

    return {
      approval: updated,
      transaction,
    }
  })
}

export async function rejectTimeOffRequest(options: {
  requestId: number
  approverId: number
  approverNote?: string | null
}): Promise<ApprovalRequest & { timeOffDetails: TimeOffRequestDetails | null }> {
  const { requestId, approverId, approverNote } = options

  return prisma.$transaction(async tx => {
    const approval = await tx.approvalRequest.findUnique({
      where: { id: requestId },
      include: { timeOffDetails: true },
    })

    if (!approval) {
      throw new Error('Request not found')
    }
    if (approval.status !== ApprovalStatus.PENDING) {
      throw new Error('Only pending requests can be rejected')
    }

    return tx.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: ApprovalStatus.REJECTED,
        reviewedById: approverId,
        decidedAt: new Date(),
        approverNote: approverNote ?? null,
      },
      include: { timeOffDetails: true },
    })
  })
}

export type ApprovalFilters = {
  requestType?: ApprovalRequestType
  status?: ApprovalStatus | 'All'
  requestedById?: number
  reviewedById?: number
  limit?: number
}

export async function listApprovalRequests(filters: ApprovalFilters) {
  const { requestType, status, requestedById, reviewedById, limit } = filters

  const where: Prisma.ApprovalRequestWhereInput = {
    requestType,
    requestedById,
    reviewedById,
  }

  if (status && status !== 'All') {
    where.status = status
  }

  return prisma.approvalRequest.findMany({
    where,
    include: {
      timeOffDetails: true,
      requestedBy: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      submittedAt: 'desc',
    },
    take: limit ?? 50,
  })
}
