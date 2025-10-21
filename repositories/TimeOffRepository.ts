import { prisma } from '@/lib/prisma'
import {
  LeaveRequestType,
  LeaveType,
  Prisma,
  TimeOffBalance,
  TimeOffEntryKind,
  TimeOffTransaction,
} from '@prisma/client'

const normalizeDate = (value: Date): Date => {
  const copy = new Date(value)
  copy.setHours(0, 0, 0, 0)
  return copy
}

const startOfMonth = (value: Date): Date => {
  return new Date(value.getFullYear(), value.getMonth(), 1)
}

const endOfMonth = (value: Date): Date => {
  return new Date(value.getFullYear(), value.getMonth() + 1, 0, 23, 59, 59, 999)
}

export type TimeOffTransactionFilters = {
  userId?: number
  type?: LeaveType
  requestedType?: LeaveRequestType
  startDate?: Date
  endDate?: Date
  limit?: number
  kind?: TimeOffEntryKind
  kinds?: TimeOffEntryKind[]
}

export async function getTimeOffBalances(userId: number): Promise<TimeOffBalance[]> {
  return prisma.timeOffBalance.findMany({
    where: { userId },
    orderBy: { type: 'asc' },
  })
}

const mapRequestedToStored = (
  requested: LeaveRequestType
): { storedType: LeaveType; affectsBalance: boolean } => {
  if (requested === LeaveRequestType.SICK) {
    return { storedType: LeaveType.SICK, affectsBalance: true }
  }

  if (requested === LeaveRequestType.UNPAID) {
    return { storedType: LeaveType.VACATION, affectsBalance: false }
  }

  return { storedType: LeaveType.VACATION, affectsBalance: true }
}

export async function getTimeOffTransactions(
  filters: TimeOffTransactionFilters
): Promise<TimeOffTransaction[]> {
  const { userId, type, requestedType, startDate, endDate, limit, kind, kinds } = filters
  const where: Prisma.TimeOffTransactionWhereInput = {}

  if (typeof userId === 'number') {
    where.userId = userId
  }
  if (type) {
    where.type = type
  }
  if (requestedType) {
    where.requestedType = requestedType
  }
  if (kind) {
    where.kind = kind
  }
  if (kinds && kinds.length > 0) {
    where.kind = { in: kinds }
  }
  if (startDate || endDate) {
    where.effectiveDate = {
      ...(startDate ? { gte: normalizeDate(startDate) } : {}),
      ...(endDate ? { lte: normalizeDate(endDate) } : {}),
    }
  }

  return prisma.timeOffTransaction.findMany({
    where,
    orderBy: [{ effectiveDate: 'desc' }, { createdAt: 'desc' }],
    take: limit ?? 50,
  })
}

export async function getTimeOffSummaryForUser(
  userId: number,
  options?: {
    limit?: number
    includeKinds?: TimeOffEntryKind[]
  }
): Promise<{
  balances: TimeOffBalance[]
  transactions: TimeOffTransaction[]
}> {
  const [balances, transactions] = await Promise.all([
    getTimeOffBalances(userId),
    getTimeOffTransactions({
      userId,
      limit: options?.limit ?? 25,
      ...(options?.includeKinds ? { kinds: options.includeKinds } : {}),
    }),
  ])

  return { balances, transactions }
}

export type RecordTimeOffTransactionInput = {
  userId: number
  recordedById?: number
  requestedType: LeaveRequestType
  kind: TimeOffEntryKind
  days: number
  effectiveDate: Date
  periodStart?: Date | null
  periodEnd?: Date | null
  note?: string | null
}

export async function recordTimeOffTransaction(
  input: RecordTimeOffTransactionInput
): Promise<TimeOffTransaction> {
  const {
    userId,
    recordedById,
    requestedType,
    kind,
    days,
    effectiveDate,
    periodStart,
    periodEnd,
    note,
  } = input

  if (!days || Number.isNaN(days)) {
    throw new Error('Days must be a non-zero number')
  }

  let delta = new Prisma.Decimal(days)
  const { storedType, affectsBalance } = mapRequestedToStored(requestedType)

  if (kind === TimeOffEntryKind.ACCRUAL) {
    if (delta.lte(0)) {
      throw new Error('Accrual transactions must add a positive amount')
    }
  } else if (kind === TimeOffEntryKind.USAGE) {
    if (delta.lte(0)) {
      throw new Error('Usage transactions require a positive day count')
    }
    delta = delta.neg()
  }

  const normalizedEffectiveDate = normalizeDate(effectiveDate)
  const normalizedPeriodStart = periodStart ? normalizeDate(periodStart) : null
  const normalizedPeriodEnd = periodEnd ? normalizeDate(periodEnd) : null

  const transactionDays = affectsBalance ? delta : new Prisma.Decimal(days)

  const performBalanceMutation = affectsBalance
    ? async (tx: Prisma.TransactionClient) => {
        await tx.timeOffBalance.upsert({
          where: {
            userId_type: {
              userId,
              type: storedType,
            },
          },
          update: {
            balance: { increment: delta },
          },
          create: {
            userId,
            type: storedType,
            balance: delta,
          },
        })
      }
    : async () => {
        // No balance impact for this requested type (e.g., unpaid leave).
      }

  return prisma.$transaction(async tx => {
    await performBalanceMutation(tx)

    return tx.timeOffTransaction.create({
      data: {
        userId,
        recordedById,
        type: storedType,
        requestedType,
        kind,
        days: transactionDays,
        effectiveDate: normalizedEffectiveDate,
        periodStart: normalizedPeriodStart,
        periodEnd: normalizedPeriodEnd,
        note: note ?? null,
      },
    })
  })
}

export type AccrualResult = {
  month: Date
  created: number
  skipped: number
}

export async function accrueMonthlyVacationLeave(options: {
  month: Date
  recordedById?: number
  amountPerType?: number
}): Promise<AccrualResult> {
  const { month, recordedById, amountPerType = 1 } = options
  if (amountPerType <= 0) {
    throw new Error('Accrual amount must be positive')
  }

  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)

  // 1. Find users who were employed during the month
  const users = await prisma.user.findMany({
    where: {
      startDate: {
        lte: monthEnd,
      },
    },
    select: {
      id: true,
    },
  })

  // 2. Find existing VACATION accruals for the month to avoid duplicates
  const existingAccruals = await prisma.timeOffTransaction.findMany({
    where: {
      kind: TimeOffEntryKind.ACCRUAL,
      effectiveDate: monthStart,
      type: LeaveType.VACATION,
      userId: { in: users.map(u => u.id) },
    },
    select: {
      userId: true,
    },
  })
  const alreadyAccrued = new Set(existingAccruals.map(e => e.userId))

  let created = 0
  let skipped = 0

  // 3. For each user, check their worked days and accrue if eligible
  await prisma.$transaction(async tx => {
    for (const user of users) {
      if (alreadyAccrued.has(user.id)) {
        skipped++
        continue
      }

      // 3a. Count worked days for the user in the given month
      const taskEntries = await tx.taskEntry.findMany({
        where: {
          userId: user.id,
          weekStartDate: {
            // Query weeks that can overlap with the month
            gte: new Date(monthStart.getFullYear(), monthStart.getMonth(), 1 - 6),
            lte: monthEnd,
          },
        },
      })

      const workedDays = new Set<string>()
      const dailyHoursFields: (keyof (typeof taskEntries)[0])[] = [
        'hoursMon',
        'hoursTue',
        'hoursWed',
        'hoursThu',
        'hoursFri',
      ]

      for (const entry of taskEntries) {
        for (let i = 0; i < dailyHoursFields.length; i++) {
          const dayDate = new Date(entry.weekStartDate)
          dayDate.setDate(dayDate.getDate() + i)

          if (dayDate.getMonth() === monthStart.getMonth()) {
            const hours = Number(entry[dailyHoursFields[i]])
            if (hours > 0) {
              workedDays.add(dayDate.toISOString().split('T')[0])
            }
          }
        }
      }

      // 3b. Accrue if the user worked more than 10 days
      if (workedDays.size > 10) {
        const delta = new Prisma.Decimal(amountPerType)

        await tx.timeOffBalance.upsert({
          where: { userId_type: { userId: user.id, type: LeaveType.VACATION } },
          update: { balance: { increment: delta } },
          create: { userId: user.id, type: LeaveType.VACATION, balance: delta },
        })

        await tx.timeOffTransaction.create({
          data: {
            userId: user.id,
            recordedById,
            type: LeaveType.VACATION,
            requestedType: LeaveRequestType.VACATION,
            kind: TimeOffEntryKind.ACCRUAL,
            days: delta,
            effectiveDate: monthStart,
            periodStart: monthStart,
            periodEnd: monthEnd,
            note: `Monthly accrual for ${monthStart.toISOString().slice(0, 7)}`,
          },
        })
        created++
      } else {
        skipped++
      }
    }
  })

  return {
    month: monthStart,
    created,
    skipped,
  }
}

/**
 * Grants the initial 10 days of sick leave to a user, typically after their probation period.
 * This is a one-time operation per user.
 * @param userId The ID of the user to grant sick leave to.
 * @param recordedById The ID of the admin performing the action.
 * @returns A promise that resolves to the created TimeOffTransaction object.
 * @throws Throws an error if the user has already been granted the initial sick leave.
 */
export async function grantInitialSickLeave(userId: number, recordedById: number) {
  return prisma.$transaction(async tx => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { initialSickLeaveGranted: true },
    })

    if (!user) {
      throw new Error('User not found')
    }

    if (user.initialSickLeaveGranted) {
      throw new Error('Initial sick leave has already been granted to this user.')
    }

    const sickLeaveDays = new Prisma.Decimal(10)

    // 1. Update the user's sick leave balance
    await tx.timeOffBalance.upsert({
      where: { userId_type: { userId, type: LeaveType.SICK } },
      update: { balance: { increment: sickLeaveDays } },
      create: { userId, type: LeaveType.SICK, balance: sickLeaveDays },
    })

    // 2. Mark the user as having received the grant
    await tx.user.update({
      where: { id: userId },
      data: { initialSickLeaveGranted: true },
    })

    // 3. Create a transaction record for auditing
    return tx.timeOffTransaction.create({
      data: {
        userId,
        recordedById,
        type: LeaveType.SICK,
        requestedType: LeaveRequestType.SICK,
        kind: TimeOffEntryKind.ADJUSTMENT, // Or a new kind e.g., INITIAL_GRANT
        days: sickLeaveDays,
        effectiveDate: new Date(),
        note: 'Initial grant of 10 sick leave days after probation period.',
      },
    })
  })
}
