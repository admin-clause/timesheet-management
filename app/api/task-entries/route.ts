import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { upsertTaskEntries, getTaskEntriesForWeek } from '@/repositories/TaskEntryRepository';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userId = (session.user as any).id;
  let entries;

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

  if (!session || !(session.user as any)?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userId = (session.user as any).id;
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
    return NextResponse.json(entries);
  } catch (error) {
    console.error('GET /api/task-entries Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
