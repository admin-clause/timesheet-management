import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getTaskEntriesForWeek, upsertTaskEntries, type TaskEntryInput } from '@/repositories/TaskEntryRepository';
import { TaskEntry } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userIdString = session.user.id;
  const userId = parseInt(userIdString, 10);
  let entries: TaskEntryInput[];

  try {
    entries = await request.json();
    // Basic validation: check if entries is an array
    if (!Array.isArray(entries)) {
      return new NextResponse('Bad Request: Expected an array of task entries.', { status: 400 });
    }
  } catch (error) {
    return new NextResponse('Bad Request: Invalid JSON format.', { status: 400 });
  }

  try {
    const result = await upsertTaskEntries(userId, entries);
    return NextResponse.json(result, { status: 201 }); // 201 Created
  } catch (error) {
    console.error('POST /api/task-entries Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userIdString = session.user.id;
  const userId = parseInt(userIdString, 10);
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');

  if (!dateParam) {
    return new NextResponse('Bad Request: Missing date parameter.', { status: 400 });
  }

  const date = new Date(dateParam);
  if (isNaN(date.getTime())) {
    return new NextResponse('Bad Request: Invalid date format.', { status: 400 });
  }

  try {
    const entries = await getTaskEntriesForWeek(userId, date);
    const entriesAsNumbers = entries.map((entry: TaskEntry) => ({
      ...entry,
      hours: Number(entry.hours)
    }));
    return NextResponse.json(entriesAsNumbers);
  } catch (error) {
    console.error('GET /api/task-entries Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
