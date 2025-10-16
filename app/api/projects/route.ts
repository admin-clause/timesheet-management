import { getAllProjects } from '@/repositories/ProjectRepository'
import { ProjectStatus } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status')

    // Validate that status is a valid ProjectStatus enum value if it exists
    const filters = status && Object.values(ProjectStatus).includes(status as ProjectStatus)
        ? { status: status as ProjectStatus }
        : undefined;

    const projects = await getAllProjects(filters)
    return NextResponse.json(projects)
  } catch (error) {
    console.error('GET /api/projects Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

import { createProject } from '@/repositories/ProjectRepository'

// ... (other imports)

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!isAdmin(session)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const body = await request.json()
    // Basic validation
    if (!body.name) {
      return new NextResponse('Bad Request: name is required', { status: 400 })
    }
    const newProject = await createProject(body)
    return NextResponse.json(newProject, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      return new NextResponse('Conflict: A project with this name already exists', { status: 409 })
    }
    console.error('POST /api/projects Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
