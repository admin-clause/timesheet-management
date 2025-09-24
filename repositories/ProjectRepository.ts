import { prisma } from '@/lib/prisma';

/**
 * Fetches all projects from the database, ordered by name.
 * @returns A promise that resolves to an array of projects.
 * @throws Throws an error if the database query fails.
 */
export async function getAllProjects() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return projects;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch projects.');
  }
}
