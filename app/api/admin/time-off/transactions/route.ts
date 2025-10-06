import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/utils'
import {
  getTimeOffTransactions,
  recordTimeOffTransaction,
  TimeOffTransactionFilters,
} from '@/repositories/TimeOffRepository'
import { LeaveRequestType, TimeOffEntryKind } from '@prisma/client'

const REQUESTED_TYPE_VALUES = [
  'SICK',
  'VACATION',
  'BEREAVEMENT',
  'UNPAID',
  'MILITARY',
  'JURY_DUTY',
  'PARENTAL',
  'OTHER',
] as const

const ENTRY_KIND_VALUES = ['ACCRUAL', 'USAGE', 'ADJUSTMENT'] as const

const parseIntOrNull = (value: string | null): number | undefined => {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const parseDateOrNull = (value: string | null): Date | undefined => {
  if (!value) return undefined
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

const parseRequestedType = (value: string | undefined): LeaveRequestType | undefined => {
  if (!value) return undefined
  return (REQUESTED_TYPE_VALUES as readonly string[]).includes(value) ? (value as LeaveRequestType) : undefined
}

const parseEntryKind = (value: string | undefined): TimeOffEntryKind | undefined => {
  if (!value) return undefined
  return (ENTRY_KIND_VALUES as readonly string[]).includes(value) ? (value as TimeOffEntryKind) : undefined
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const url = new URL(request.url)
  const params = url.searchParams

  const userId = parseIntOrNull(params.get('userId'))
  const requestedType = parseRequestedType(params.get('type') ?? undefined)
  const limit = parseIntOrNull(params.get('limit'))
  const startDate = parseDateOrNull(params.get('startDate'))
  const endDate = parseDateOrNull(params.get('endDate'))

  const kindsParam = params.getAll('kind')
  const kinds = kindsParam
    .map(value => parseEntryKind(value))
    .filter((kind): kind is TimeOffEntryKind => !!kind)

  const filters: TimeOffTransactionFilters = {
    userId,
    requestedType,
    startDate,
    endDate,
    limit,
    ...(kinds.length === 1 ? { kind: kinds[0] } : {}),
    ...(kinds.length > 1 ? { kinds } : {}),
  }

  try {
    const transactions = await getTimeOffTransactions(filters)
    return NextResponse.json(
      transactions.map(transaction => ({
        ...transaction,
        days: transaction.days.toString(),
      })),
    )
  } catch (error) {
    console.error('GET /api/admin/time-off/transactions error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  let body: {
    userId?: number
    requestedType?: string
    type?: string
    kind?: string
    days?: number
    effectiveDate?: string
    periodStart?: string | null
    periodEnd?: string | null
    note?: string | null
  }
  try {
    body = await request.json()
  } catch (error) {
    console.error('POST /api/admin/time-off/transactions invalid JSON body:', error)
    return new NextResponse('Bad Request: Invalid JSON body', { status: 400 })
  }

  const userId = body.userId
  const requestedType = parseRequestedType(body.requestedType ?? body.type)
  const kind = parseEntryKind(body.kind)
  const days = body.days
  const effectiveDate = body.effectiveDate ? parseDateOrNull(body.effectiveDate) : new Date()
  const periodStart = body.periodStart ? parseDateOrNull(body.periodStart) : undefined
  const periodEnd = body.periodEnd ? parseDateOrNull(body.periodEnd) : undefined

  if (!userId || !Number.isFinite(userId)) {
    return new NextResponse('Bad Request: userId is required', { status: 400 })
  }

  if (!requestedType) {
    return new NextResponse('Bad Request: requestedType is invalid or missing', { status: 400 })
  }

  if (!kind) {
    return new NextResponse('Bad Request: kind is invalid or missing', { status: 400 })
  }

  if (typeof days !== 'number' || Number.isNaN(days) || days === 0) {
    return new NextResponse('Bad Request: days must be a non-zero number', { status: 400 })
  }

  if (!effectiveDate) {
    return new NextResponse('Bad Request: effectiveDate is invalid', { status: 400 })
  }

  try {
    const transaction = await recordTimeOffTransaction({
      userId,
      recordedById: session?.user?.id ? Number(session.user.id) : undefined,
      requestedType,
      kind,
      days,
      effectiveDate,
      periodStart: periodStart ?? undefined,
      periodEnd: periodEnd ?? undefined,
      note: body.note ?? null,
    })

    return NextResponse.json(
      {
        ...transaction,
        days: transaction.days.toString(),
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('POST /api/admin/time-off/transactions error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
