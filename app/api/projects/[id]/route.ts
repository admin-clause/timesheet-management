import { NextResponse, type NextRequest } from 'next/server';
import { updateProject, deleteProject } from '@/repositories/ProjectRepository';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/utils';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return new NextResponse('Bad Request: Invalid project ID', { status: 400 });
    }

    const body = await request.json();
    const { name } = body;
    if (!name) {
      return new NextResponse('Bad Request: name is required', { status: 400 });
    }

    const updatedProject = await updateProject(projectId, name);
    return NextResponse.json(updatedProject);

  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      return new NextResponse('Conflict: A project with this name already exists', { status: 409 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return new NextResponse('Bad Request: Invalid project ID', { status: 400 });
    }

    await deleteProject(projectId);
    return new NextResponse(null, { status: 204 });

  } catch {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
