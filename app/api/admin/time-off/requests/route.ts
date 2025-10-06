import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/utils'
import { listApprovalRequests, ApprovalFilters } from '@/repositories/TimeOffApprovalRepository'
import { ApprovalStatus } from '@prisma/client'

const parseStatus = (value: string | null): ApprovalStatus | undefined => {
  if (!value) return undefined
  return (Object.values(ApprovalStatus) as string[]).includes(value) ? (value as ApprovalStatus) : undefined
}

const parseLimit = (value: string | null): number | undefined => {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const url = new URL(request.url)
  const status = parseStatus(url.searchParams.get('status'))
  const requestedById = url.searchParams.get('userId')
  const limit = parseLimit(url.searchParams.get('limit'))

  const filters: ApprovalFilters = {
    status,
    requestedById: requestedById ? Number(requestedById) : undefined,
    limit,
  }

  try {
    const approvals = await listApprovalRequests(filters)
    return NextResponse.json(
      approvals.map(request => ({
        ...request,
        timeOffDetails: request.timeOffDetails
          ? {
              ...request.timeOffDetails,
              totalDays: request.timeOffDetails.totalDays.toString(),
              partialStartDays: request.timeOffDetails.partialStartDays?.toString() ?? null,
              partialEndDays: request.timeOffDetails.partialEndDays?.toString() ?? null,
            }
          : null,
      })),
    )
  } catch (error) {
    console.error('GET /api/admin/time-off/requests error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
