import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/utils'
import { accrueMonthlyVacationLeave } from '@/repositories/TimeOffRepository'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

const parseMonth = (value: string): Date | null => {
  if (!/^\d{4}-\d{2}$/.test(value)) {
    return null
  }
  const [year, month] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, 1))
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  let body: { month?: string; amountPerType?: number } = {}
  try {
    body = await request.json()
  } catch {
    // ignore JSON parse errors and fall back to defaults
  }

  const now = new Date()
  const targetMonth = body.month
    ? parseMonth(body.month)
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  if (!targetMonth) {
    return new NextResponse('Bad Request: month must be formatted as YYYY-MM', { status: 400 })
  }

  const amount = body.amountPerType ?? 1
  if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
    return new NextResponse('Bad Request: amountPerType must be a positive number', { status: 400 })
  }

  try {
    const result = await accrueMonthlyVacationLeave({
      month: targetMonth,
      amountPerType: amount,
      recordedById: session?.user?.id ? Number(session.user.id) : undefined,
    })

    return NextResponse.json({
      month: result.month.toISOString(),
      created: result.created,
      skipped: result.skipped,
    })
  } catch (error) {
    console.error('POST /api/admin/time-off/accrual error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
