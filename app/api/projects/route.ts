import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/utils'
import { createProject, getAllProjects } from '@/repositories/ProjectRepository'
import { getServerSession } from 'next-auth'
import { NextResponse, type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const projects = await getAllProjects()
    return NextResponse.json(projects)
  } catch {
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!isAdmin(session)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const body = await request.json()
    const { name } = body
    if (!name) {
      return new NextResponse('Bad Request: name is required', { status: 400 })
    }
    const newProject = await createProject(name)
    return NextResponse.json(newProject, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      return new NextResponse('Conflict: A project with this name already exists', { status: 409 })
    }
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}