import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/utils'
import { getPreviousTaskNames } from '@/repositories/TaskEntryRepository'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) {
    return new NextResponse('Forbidden', { status: 403 })
  }
  if (!session || !session.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  try {
    const taskNames = await getPreviousTaskNames(Number(session.user.id), 10)
    return NextResponse.json(taskNames)
  } catch (error) {
    console.error('GET /api/tasks Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
