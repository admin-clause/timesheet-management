import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/utils';
import { getAllUsers, createUser } from '@/repositories/UserRepository';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users
 * Fetches all users. Admin only.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    const users = await getAllUsers();
    // Never return passwords, even hashed ones, in an API response
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    return NextResponse.json(usersWithoutPasswords);
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * POST /api/users
 * Creates a new user. Admin only.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return new NextResponse('Bad Request: name, email, password, and role are required', { status: 400 });
    }

    if (role !== Role.ADMIN && role !== Role.USER) {
      return new NextResponse('Bad Request: role must be ADMIN or USER', { status: 400 });
    }

    const newUser = await createUser({ name, email, password, role });
    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword, { status: 201 });

  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      return new NextResponse('Conflict: A user with this email already exists', { status: 409 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
