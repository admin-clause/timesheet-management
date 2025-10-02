import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/utils';
import { deleteTaskEntry } from '@/repositories/TaskEntryRepository';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session || !session.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const actingUserId = parseInt(session.user.id, 10);
  const taskEntryId = parseInt(id, 10);

  if (Number.isNaN(actingUserId)) {
    return new NextResponse('Bad Request: Invalid session user id.', { status: 400 });
  }
  if (isNaN(taskEntryId)) {
    return new NextResponse('Bad Request: Invalid task entry ID.', { status: 400 });
  }

  const url = new URL(request.url);
  const userIdParam = url.searchParams.get('userId');

  let targetUserId = actingUserId;
  if (userIdParam !== null) {
    const parsedTarget = parseInt(userIdParam, 10);
    if (Number.isNaN(parsedTarget)) {
      return new NextResponse('Bad Request: Invalid userId parameter.', { status: 400 });
    }
    if (!isAdmin(session) && parsedTarget !== actingUserId) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    targetUserId = parsedTarget;
  }

  try {
    const result = await deleteTaskEntry(targetUserId, taskEntryId);

    if (result.count === 0) {
      // Nothing was deleted. This could be because the entry does not exist,
      // or the user does not have permission to delete it. 
      // We return 404 to not leak information.
      return new NextResponse('Not Found', { status: 404 });
    }

    // Standard success response for DELETE is 204 No Content.
    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error(`DELETE /api/task-entries/${taskEntryId} Error:`, error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
