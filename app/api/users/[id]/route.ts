import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/utils'
import { deleteUser, updateUser } from '@/repositories/UserRepository'
import { Role } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * PUT /api/users/[id]
 * Updates a user. Admin only.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const { id } = await params
    const userId = parseInt(id, 10)
    if (isNaN(userId)) {
      return new NextResponse('Bad Request: Invalid user ID', { status: 400 })
    }

    const body = await request.json()
    const { name, email, role } = body

    // Basic validation for the data
    if (!name && !email && !role) {
      return new NextResponse(
        'Bad Request: At least one field (name, email, role) must be provided for update',
        { status: 400 }
      )
    }
    if (role && role !== Role.ADMIN && role !== Role.USER) {
      return new NextResponse('Bad Request: role must be ADMIN or USER', { status: 400 })
    }

    const updatedUser = await updateUser(userId, { name, email, role })
    const { password: _, ...userWithoutPassword } = updatedUser
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      return new NextResponse('Conflict: A user with this email already exists', { status: 409 })
    }
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

/**
 * DELETE /api/users/[id]
 * Deletes a user. Admin only.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new NextResponse('Forbidden', { status: 403 })
  }
  if (!isAdmin(session)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const { id } = await params
    const userId = parseInt(id, 10)
    if (isNaN(userId)) {
      return new NextResponse('Bad Request: Invalid user ID', { status: 400 })
    }

    // Prevent an admin from deleting themselves
    if (session.user?.id === id) {
      return new NextResponse('Bad Request: Admins cannot delete themselves.', { status: 400 })
    }

    await deleteUser(userId)
    return new NextResponse(null, { status: 204 })
  } catch {
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
