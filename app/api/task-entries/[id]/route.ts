import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { deleteTaskEntry } from '@/repositories/TaskEntryRepository';

interface RouteParams {
  params: { id: string };
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userId = (session.user as any).id;
  const taskEntryId = parseInt(params.id, 10);

  if (isNaN(taskEntryId)) {
    return new NextResponse('Bad Request: Invalid task entry ID.', { status: 400 });
  }

  try {
    const result = await deleteTaskEntry(userId, taskEntryId);

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
