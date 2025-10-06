import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getTimeOffSummaryForUser } from '@/repositories/TimeOffRepository'
import { TimeOffEntryKind } from '@prisma/client'

const parseLimit = (value: string | null): number | undefined => {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const url = new URL(request.url)
  const limit = parseLimit(url.searchParams.get('limit')) ?? 25

  const includeKindsParam = url.searchParams.getAll('kind')
  const includeKinds = includeKindsParam
    .map(value => (Object.values(TimeOffEntryKind) as string[]).includes(value) ? (value as TimeOffEntryKind) : undefined)
    .filter((value): value is TimeOffEntryKind => !!value)

  try {
    const summary = await getTimeOffSummaryForUser(Number(session.user.id), {
      limit,
      includeKinds: includeKinds.length > 0 ? includeKinds : undefined,
    })

    return NextResponse.json({
      balances: summary.balances.map(balance => ({
        ...balance,
        balance: balance.balance.toString(),
      })),
      transactions: summary.transactions.map(transaction => ({
        ...transaction,
        days: transaction.days.toString(),
      })),
    })
  } catch (error) {
    console.error('GET /api/time-off/me error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
