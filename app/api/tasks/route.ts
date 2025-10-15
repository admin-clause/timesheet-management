import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/utils'
import { getPreviousTaskNames } from '@/repositories/TaskEntryRepository'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const actingUserId = parseInt(session.user.id, 10)
  if (isNaN(actingUserId)) {
    return new NextResponse('Bad Request: Invalid session user id.', { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const userIdParam = searchParams.get('userId')

  let targetUserId = actingUserId
  if (userIdParam) {
    const parsedTarget = parseInt(userIdParam, 10)
    if (isNaN(parsedTarget)) {
      return new NextResponse('Bad Request: Invalid userId parameter.', { status: 400 })
    }
    // Admin can specify a user, otherwise users can only see their own tasks
    if (!isAdmin(session) && parsedTarget !== actingUserId) {
      return new NextResponse('Forbidden', { status: 403 })
    }
    targetUserId = parsedTarget
  }

  try {
    const taskNames = await getPreviousTaskNames(targetUserId)
    return NextResponse.json(taskNames)
  } catch (error) {
    console.error('GET /api/tasks Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
