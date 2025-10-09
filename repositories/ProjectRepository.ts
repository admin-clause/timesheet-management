import { prisma } from '@/lib/prisma'
import { ProjectStatus } from '@prisma/client'

/**
 * Fetches all projects from the database, ordered by name.
 * @returns A promise that resolves to an array of projects.
 * @throws Throws an error if the database query fails.
 */
export async function getAllProjects() {
  try {
    const projects = await prisma.project.findMany({
      where: {
        status: {
          not: ProjectStatus.ARCHIVED,
        },
      },
      orderBy: {
        id: 'asc',
      },
    })
    return projects
  } catch (error) {
    console.error('Database Error fetching projects:', error)
    throw new Error('Failed to fetch projects.')
  }
}

/**
 * Creates a new project.
 * @param name The name of the new project.
 * @returns A promise that resolves to the newly created project object.
 * @throws Throws an error if the database query fails.
 */
export async function createProject(name: string) {
  try {
    const newProject = await prisma.project.create({
      data: {
        name,
      },
    })
    return newProject
  } catch (error) {
    console.error('Database Error creating project:', error)
    throw new Error('Failed to create project.')
  }
}

/**
 * Updates the name of a specific project.
 * @param projectId The ID of the project to update.
 * @param newName The new name for the project.
 * @returns A promise that resolves to the updated project object.
 * @throws Throws an error if the project is not found or the update fails.
 */
export async function updateProject(projectId: number, newName: string) {
  try {
    const updatedProject = await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        name: newName,
      },
    })
    return updatedProject
  } catch (error) {
    console.error('Database Error updating project:', error)
    throw new Error('Failed to update project.')
  }
}

/**
 * Deletes a project by its ID.
 * @param projectId The ID of the project to delete.
 * @returns A promise that resolves to the deleted project object.
 * @throws Throws an error if the project is not found or the delete fails.
 */
export async function deleteProject(projectId: number) {
  try {
    const deletedProject = await prisma.project.delete({
      where: {
        id: projectId,
      },
    })
    return deletedProject
  } catch (error) {
    console.error('Database Error deleting project:', error)
    throw new Error('Failed to delete project.')
  }
}
