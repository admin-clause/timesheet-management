import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/utils'
import { approveTimeOffRequest } from '@/repositories/TimeOffApprovalRepository'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new NextResponse('Forbidden', { status: 403 })
  }
  if (!isAdmin(session)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const { id } = await params
  const requestId = Number(id)
  if (Number.isNaN(requestId)) {
    return new NextResponse('Bad Request: invalid request id', { status: 400 })
  }

  let body: { approverNote?: string }
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  try {
    const result = await approveTimeOffRequest({
      requestId,
      approverId: Number(session?.user?.id ?? 0),
      approverNote: body.approverNote ?? null,
    })
    return NextResponse.json({
      approval: result.approval,
      transaction: result.transaction
        ? {
            ...result.transaction,
            days: result.transaction.days.toString(),
          }
        : null,
    })
  } catch (error) {
    console.error(`POST /api/admin/time-off/requests/${requestId}/approve error:`, error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
