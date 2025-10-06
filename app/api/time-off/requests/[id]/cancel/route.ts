import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { cancelTimeOffRequest } from '@/repositories/TimeOffApprovalRepository'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { id } = await params
  const requestId = Number(id)
  if (Number.isNaN(requestId)) {
    return new NextResponse('Bad Request: invalid request id', { status: 400 })
  }

  try {
    const approval = await cancelTimeOffRequest(requestId, Number(session.user.id))
    return NextResponse.json(approval)
  } catch (error) {
    console.error(`POST /api/time-off/requests/${requestId}/cancel error:`, error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
