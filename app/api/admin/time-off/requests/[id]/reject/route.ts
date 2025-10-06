import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/utils'
import { rejectTimeOffRequest } from '@/repositories/TimeOffApprovalRepository'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
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
    const approval = await rejectTimeOffRequest({
      requestId,
      approverId: Number(session.user?.id),
      approverNote: body.approverNote ?? null,
    })
    return NextResponse.json(approval)
  } catch (error) {
    console.error(`POST /api/admin/time-off/requests/${requestId}/reject error:`, error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
