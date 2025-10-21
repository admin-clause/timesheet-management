import { prisma } from '@/lib/prisma';
import { Role, EmploymentType, EmployeeStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

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
        companyEmail: email,
      },
    });
  } catch (error) {
    // In a real app, you'd want to log this error to a logging service
    console.error('Database Error:', error);
    throw new Error('Failed to fetch user by email.');
  }
}

/**
 * Fetches all users from the database.
 */
export async function getAllUsers() {
  try {
    return await prisma.user.findMany({
      orderBy: { id: 'asc' },
    });
  } catch (error) {
    console.error('Database Error fetching users:', error);
    throw new Error('Failed to fetch users.');
  }
}

/**
 * Creates a new user. Hashes the password before saving.
 * @param data Object containing user details.
 */
export async function createUser(data: {
  firstName: string;
  lastName: string;
  companyEmail: string;
  password: string;
  role: Role;
}) {
  try {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        companyEmail: data.companyEmail,
        password: hashedPassword,
        role: data.role,
      },
    });
  } catch (error) {
    console.error('Database Error creating user:', error);
    throw new Error('Failed to create user.');
  }
}

/**
 * Updates a user's details.
 * Does not handle password changes.
 * @param userId The ID of the user to update.
 * @param data Object containing fields to update.
 */
export async function updateUser(
  userId: number,
  data: {
    firstName?: string;
    lastName?: string;
    companyEmail?: string;
    personalEmail?: string;
    phoneNumber?: string;
    employmentType?: EmploymentType;
    employeeStatus?: EmployeeStatus;
    fobNumber?: string;
    startDate?: Date;
    endDate?: Date;
    midProbationDate?: Date;
    role?: Role;
  }
) {
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: data,
    });
  } catch (error) {
    console.error('Database Error updating user:', error);
    throw new Error('Failed to update user.');
  }
}

/**
 * Deletes a user by their ID.
 * @param userId The ID of the user to delete.
 */
export async function deleteUser(userId: number) {
  try {
    return await prisma.user.delete({
      where: { id: userId },
    });
  } catch (error) {
    console.error('Database Error deleting user:', error);
    throw new Error('Failed to delete user.');
  }
}

/**
 * Finds a user by their ID.
 * @param userId The user's ID.
 * @returns A promise that resolves to the user object or null if not found.
 */
export async function findUserById(userId: number) {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  } catch (error) {
    console.error('Database Error fetching user by ID:', error);
    throw new Error('Failed to fetch user by ID.');
  }
}

/**
 * Updates a user's password after hashing it.
 * @param userId The ID of the user to update.
 * @param newPassword The new plain-text password.
 */
export async function updateUserPassword(userId: number, newPassword: string) {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });
  } catch (error) {
    console.error('Database Error updating password:', error);
    throw new Error('Failed to update password.');
  }
}
