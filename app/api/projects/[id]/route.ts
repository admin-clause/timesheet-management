import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/utils'
import { updateProject } from '@/repositories/ProjectRepository'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)

  if (!isAdmin(session)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const { id } = await params
  const projectId = parseInt(id, 10)
  if (isNaN(projectId)) {
    return new NextResponse('Bad Request: Invalid project ID.', { status: 400 })
  }

  try {
    const body = await request.json()
    const updatedProject = await updateProject(projectId, body)
    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error(`PUT /api/projects/${projectId} Error:`, error)
    // Handle potential errors, e.g., project not found
    if (error instanceof Error && error.message.includes('not found')) {
      return new NextResponse('Not Found', { status: 404 })
    }
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
