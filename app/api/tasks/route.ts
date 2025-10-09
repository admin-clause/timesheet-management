import { authOptions } from '@/lib/auth'
import { getPreviousTaskNames } from '@/repositories/TaskEntryRepository'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  try {
    const taskNames = await getPreviousTaskNames(Number(session.user.id), 500)
    return NextResponse.json(taskNames.map(t => t.taskName))
  } catch (error) {
    console.error('GET /api/tasks Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
