import { grantInitialSickLeave } from '@/repositories/TimeOffRepository';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/auth'; // Assuming you have a utility like this

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !isAdmin(session)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return new NextResponse('Bad Request: userId is required', { status: 400 });
    }

    const recordedById = parseInt(session.user.id, 10);
    const transaction = await grantInitialSickLeave(userId, recordedById);

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/time-off/grant-initial-sick-leave Error:', error);
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 409 }); // Conflict if already granted
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
