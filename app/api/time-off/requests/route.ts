import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { createTimeOffRequest, listApprovalRequests, ApprovalFilters } from '@/repositories/TimeOffApprovalRepository'
import { LeaveRequestType, ApprovalStatus } from '@prisma/client'

const parseLeaveRequestType = (value: string | null): LeaveRequestType | undefined => {
  if (!value) return undefined
  return (Object.values(LeaveRequestType) as string[]).includes(value) ? (value as LeaveRequestType) : undefined
}

const parseStatus = (value: string | null): ApprovalStatus | undefined => {
  if (!value) return undefined
  return (Object.values(ApprovalStatus) as string[]).includes(value) ? (value as ApprovalStatus) : undefined
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const url = new URL(request.url)
  const status = parseStatus(url.searchParams.get('status'))
  const limitParam = url.searchParams.get('limit')
  const limit = limitParam ? Number(limitParam) : undefined

  const filters: ApprovalFilters = {
    requestType: undefined, // defaults to TIME_OFF in repository helper
    requestedById: Number(session.user.id),
    status,
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
    console.error('GET /api/time-off/requests error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  let body: {
    requestedType?: string
    periodStart?: string
    periodEnd?: string
    totalDays?: number
    partialStartDays?: number | null
    partialEndDays?: number | null
    requesterNote?: string | null
    overrideBalance?: boolean
  }

  try {
    body = await request.json()
  } catch (error) {
    console.error('POST /api/time-off/requests invalid JSON:', error)
    return new NextResponse('Bad Request: Invalid JSON body', { status: 400 })
  }

  const requestedType = parseLeaveRequestType(body.requestedType ?? null)
  const periodStart = body.periodStart ? new Date(body.periodStart) : null
  const periodEnd = body.periodEnd ? new Date(body.periodEnd) : null
  const totalDays = body.totalDays

  if (!requestedType) {
    return new NextResponse('Bad Request: requestedType is required', { status: 400 })
  }
  if (!periodStart || Number.isNaN(periodStart.getTime())) {
    return new NextResponse('Bad Request: periodStart is invalid', { status: 400 })
  }
  if (!periodEnd || Number.isNaN(periodEnd.getTime())) {
    return new NextResponse('Bad Request: periodEnd is invalid', { status: 400 })
  }
  if (periodEnd < periodStart) {
    return new NextResponse('Bad Request: periodEnd must be on or after periodStart', { status: 400 })
  }
  if (typeof totalDays !== 'number' || Number.isNaN(totalDays) || totalDays <= 0) {
    return new NextResponse('Bad Request: totalDays must be a positive number', { status: 400 })
  }

  try {
    const approval = await createTimeOffRequest({
      requestedById: Number(session.user.id),
      requestedType,
      periodStart,
      periodEnd,
      totalDays,
      partialStartDays: body.partialStartDays ?? null,
      partialEndDays: body.partialEndDays ?? null,
      requesterNote: body.requesterNote ?? null,
      overrideBalance: body.overrideBalance ?? false,
    })

    return NextResponse.json(
      {
        ...approval,
        timeOffDetails: approval.timeOffDetails
          ? {
              ...approval.timeOffDetails,
              totalDays: approval.timeOffDetails.totalDays.toString(),
              partialStartDays: approval.timeOffDetails.partialStartDays?.toString() ?? null,
              partialEndDays: approval.timeOffDetails.partialEndDays?.toString() ?? null,
            }
          : null,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('POST /api/time-off/requests error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
