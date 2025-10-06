import { prisma } from '@/lib/prisma';
import {
  LeaveRequestType,
  LeaveType,
  Prisma,
  TimeOffBalance,
  TimeOffEntryKind,
  TimeOffTransaction,
} from '@prisma/client';

const ACCRUAL_LEAVE_TYPES: readonly LeaveType[] = [LeaveType.SICK, LeaveType.VACATION];

const normalizeDate = (value: Date): Date => {
  const copy = new Date(value);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const startOfMonth = (value: Date): Date => {
  return new Date(value.getFullYear(), value.getMonth(), 1);
};

const endOfMonth = (value: Date): Date => {
  return new Date(value.getFullYear(), value.getMonth() + 1, 0, 23, 59, 59, 999);
};

export type TimeOffTransactionFilters = {
  userId?: number;
  type?: LeaveType;
  requestedType?: LeaveRequestType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  kind?: TimeOffEntryKind;
  kinds?: TimeOffEntryKind[];
};

export async function getTimeOffBalances(userId: number): Promise<TimeOffBalance[]> {
  return prisma.timeOffBalance.findMany({
    where: { userId },
    orderBy: { type: 'asc' },
  });
}

const mapRequestedToStored = (requested: LeaveRequestType): LeaveType => {
  return requested === LeaveRequestType.SICK ? LeaveType.SICK : LeaveType.VACATION;
};

export async function getTimeOffTransactions(filters: TimeOffTransactionFilters): Promise<TimeOffTransaction[]> {
  const { userId, type, requestedType, startDate, endDate, limit, kind, kinds } = filters;
  const where: Prisma.TimeOffTransactionWhereInput = {};

  if (typeof userId === 'number') {
    where.userId = userId;
  }
  if (type) {
    where.type = type;
  }
  if (requestedType) {
    where.requestedType = requestedType;
  }
  if (kind) {
    where.kind = kind;
  }
  if (kinds && kinds.length > 0) {
    where.kind = { in: kinds };
  }
  if (startDate || endDate) {
    where.effectiveDate = {
      ...(startDate ? { gte: normalizeDate(startDate) } : {}),
      ...(endDate ? { lte: normalizeDate(endDate) } : {}),
    };
  }

  return prisma.timeOffTransaction.findMany({
    where,
    orderBy: [{ effectiveDate: 'desc' }, { createdAt: 'desc' }],
    take: limit ?? 50,
  });
}

export async function getTimeOffSummaryForUser(userId: number, options?: {
  limit?: number;
  includeKinds?: TimeOffEntryKind[];
}): Promise<{
  balances: TimeOffBalance[];
  transactions: TimeOffTransaction[];
}> {
  const [balances, transactions] = await Promise.all([
    getTimeOffBalances(userId),
    getTimeOffTransactions({
      userId,
      limit: options?.limit ?? 25,
      ...(options?.includeKinds ? { kinds: options.includeKinds } : {}),
    }),
  ]);

  return { balances, transactions };
}

export type RecordTimeOffTransactionInput = {
  userId: number;
  recordedById?: number;
  requestedType: LeaveRequestType;
  kind: TimeOffEntryKind;
  days: number;
  effectiveDate: Date;
  periodStart?: Date | null;
  periodEnd?: Date | null;
  note?: string | null;
};

export async function recordTimeOffTransaction(input: RecordTimeOffTransactionInput): Promise<TimeOffTransaction> {
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
  } = input;

  if (!days || Number.isNaN(days)) {
    throw new Error('Days must be a non-zero number');
  }

  let delta = new Prisma.Decimal(days);
  const storageType = mapRequestedToStored(requestedType);

  if (kind === TimeOffEntryKind.ACCRUAL) {
    if (delta.lte(0)) {
      throw new Error('Accrual transactions must add a positive amount');
    }
  } else if (kind === TimeOffEntryKind.USAGE) {
    if (delta.lte(0)) {
      throw new Error('Usage transactions require a positive day count');
    }
    delta = delta.neg();
  }

  const normalizedEffectiveDate = normalizeDate(effectiveDate);
  const normalizedPeriodStart = periodStart ? normalizeDate(periodStart) : null;
  const normalizedPeriodEnd = periodEnd ? normalizeDate(periodEnd) : null;

  return prisma.$transaction(async tx => {
    await tx.timeOffBalance.upsert({
      where: {
        userId_type: {
          userId,
          type: storageType,
        },
      },
      update: {
        balance: { increment: delta },
      },
      create: {
        userId,
        type: storageType,
        balance: delta,
      },
    });

    return tx.timeOffTransaction.create({
      data: {
        userId,
        recordedById,
        type: storageType,
        requestedType,
        kind,
        days: delta,
        effectiveDate: normalizedEffectiveDate,
        periodStart: normalizedPeriodStart,
        periodEnd: normalizedPeriodEnd,
        note: note ?? null,
      },
    });
  });
}

export type AccrualResult = {
  month: Date;
  created: number;
  skipped: number;
};

export async function accrueMonthlyLeave(options: {
  month: Date;
  recordedById?: number;
  amountPerType?: number;
}): Promise<AccrualResult> {
  const { month, recordedById, amountPerType = 1 } = options;
  if (amountPerType <= 0) {
    throw new Error('Accrual amount must be positive');
  }

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const existingAccruals = await prisma.timeOffTransaction.findMany({
    where: {
      kind: TimeOffEntryKind.ACCRUAL,
      effectiveDate: monthStart,
      type: { in: ACCRUAL_LEAVE_TYPES as LeaveType[] },
    },
    select: {
      userId: true,
      type: true,
    },
  });

  const alreadyAccrued = new Set(existingAccruals.map(entry => `${entry.userId}:${entry.type}`));

  const users = await prisma.user.findMany({
    where: {
      employmentStartDate: {
        lte: monthEnd,
      },
    },
    select: {
      id: true,
    },
  });

  let created = 0;

  await prisma.$transaction(async tx => {
    for (const user of users) {
      for (const type of ACCRUAL_LEAVE_TYPES) {
        const key = `${user.id}:${type}`;
        if (alreadyAccrued.has(key)) {
          continue;
        }

        const delta = new Prisma.Decimal(amountPerType);

        await tx.timeOffBalance.upsert({
          where: {
            userId_type: {
              userId: user.id,
              type,
            },
          },
          update: {
            balance: { increment: delta },
          },
          create: {
            userId: user.id,
            type,
            balance: delta,
          },
        });

        await tx.timeOffTransaction.create({
          data: {
            userId: user.id,
            recordedById,
            type,
            requestedType: type === LeaveType.SICK ? LeaveRequestType.SICK : LeaveRequestType.VACATION,
            kind: TimeOffEntryKind.ACCRUAL,
            days: delta,
            effectiveDate: monthStart,
            periodStart: monthStart,
            periodEnd: monthEnd,
            note: `Monthly accrual for ${monthStart.toISOString().slice(0, 7)}`,
          },
        });

        alreadyAccrued.add(key);
        created += 1;
      }
    }
  });

  const totalPossible = users.length * ACCRUAL_LEAVE_TYPES.length;
  const skipped = totalPossible - created;

  return {
    month: monthStart,
    created,
    skipped,
  };
}
