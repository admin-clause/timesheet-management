import { prisma } from '@/lib/prisma';

/**
 * Finds a user by their email address.
 * @param email The user's email.
 * @returns A promise that resolves to the user object or null if not found.
 */
export async function findUserByEmail(email: string) {
  if (!email) return null;
  
  try {
    return await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
  } catch (error) {
    // In a real app, you'd want to log this error to a logging service
    console.error('Database Error:', error);
    throw new Error('Failed to fetch user by email.');
  }
}
