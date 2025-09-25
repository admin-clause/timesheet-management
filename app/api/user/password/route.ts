import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { findUserById, updateUserPassword } from '@/repositories/UserRepository';
import bcrypt from 'bcryptjs';

/**
 * PUT /api/user/password
 * Updates the password for the currently authenticated user.
 */
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // 1. Check if user is authenticated
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const userId = parseInt(session.user.id, 10);
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // 2. Validate input
    if (!currentPassword || !newPassword) {
      return new NextResponse('Bad Request: currentPassword and newPassword are required', { status: 400 });
    }
    if (newPassword.length < 6) {
      return new NextResponse('Bad Request: New password must be at least 6 characters long', { status: 400 });
    }

    // 3. Verify the current password
    const user = await findUserById(userId);
    if (!user || !user.password) {
      // This should not happen for a logged-in user, but as a safeguard:
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return new NextResponse('Unauthorized: Incorrect current password', { status: 401 });
    }

    // 4. Update to the new password
    await updateUserPassword(userId, newPassword);

    return new NextResponse(null, { status: 204 }); // Success, no content

  } catch (error) {
    console.error('PUT /api/user/password Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
