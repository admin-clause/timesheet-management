import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/utils'
import {
  getTaskEntriesForWeek,
  upsertTaskEntries,
  type TaskEntryInput,
} from '@/repositories/TaskEntryRepository'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const actingUserId = parseInt(session.user.id, 10)
  if (Number.isNaN(actingUserId)) {
    return new NextResponse('Bad Request: Invalid session user id.', { status: 400 })
  }

  const url = new URL(request.url)
  const userIdParam = url.searchParams.get('userId')

  let targetUserId = actingUserId
  if (userIdParam !== null) {
    const parsedTarget = parseInt(userIdParam, 10)
    if (Number.isNaN(parsedTarget)) {
      return new NextResponse('Bad Request: Invalid userId parameter.', { status: 400 })
    }
    if (!isAdmin(session) && parsedTarget !== actingUserId) {
      return new NextResponse('Forbidden', { status: 403 })
    }
    targetUserId = parsedTarget
  }

  let entries: TaskEntryInput[]

  try {
    entries = await request.json()
    // Basic validation: check if entries is an array
    if (!Array.isArray(entries)) {
      return new NextResponse('Bad Request: Expected an array of task entries.', { status: 400 })
    }
  } catch {
    return new NextResponse('Bad Request: Invalid JSON format.', { status: 400 })
  }

  try {
    const result = await upsertTaskEntries(targetUserId, entries)
    return NextResponse.json(result, { status: 201 }) // 201 Created
  } catch (error) {
    console.error('POST /api/task-entries Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const actingUserId = parseInt(session.user.id, 10)
  if (Number.isNaN(actingUserId)) {
    return new NextResponse('Bad Request: Invalid session user id.', { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const dateParam = searchParams.get('date')
  const userIdParam = searchParams.get('userId')

  let targetUserId = actingUserId
  if (userIdParam !== null) {
    const parsedTarget = parseInt(userIdParam, 10)
    if (Number.isNaN(parsedTarget)) {
      return new NextResponse('Bad Request: Invalid userId parameter.', { status: 400 })
    }
    if (!isAdmin(session) && parsedTarget !== actingUserId) {
      return new NextResponse('Forbidden', { status: 403 })
    }
    targetUserId = parsedTarget
  }

  if (!dateParam) {
    return new NextResponse('Bad Request: Missing date parameter.', { status: 400 })
  }

  const date = new Date(dateParam)
  if (isNaN(date.getTime())) {
    return new NextResponse('Bad Request: Invalid date format.', { status: 400 })
  }

  try {
    const entries = await getTaskEntriesForWeek(targetUserId, date)
    // Convert Decimal hour values to numbers for JSON serialization
    const entriesAsNumbers = entries.map(entry => ({
      ...entry,
      hoursMon: Number(entry.hoursMon),
      hoursTue: Number(entry.hoursTue),
      hoursWed: Number(entry.hoursWed),
      hoursThu: Number(entry.hoursThu),
      hoursFri: Number(entry.hoursFri),
    }))
    return NextResponse.json(entriesAsNumbers)
  } catch (error) {
    console.error('GET /api/task-entries Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
