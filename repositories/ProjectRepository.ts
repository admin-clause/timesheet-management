import { prisma } from '@/lib/prisma'
import { ProjectStatus } from '@prisma/client'

type ProjectFilters = {
  status?: ProjectStatus
}

/**
 * Fetches projects from the database, with optional filters.
 * @param filters Optional filters to apply, e.g., { status: 'ACTIVE' }.
 * @returns A promise that resolves to an array of projects.
 * @throws Throws an error if the database query fails.
 */
export async function getAllProjects(filters?: ProjectFilters) {
  try {
    const whereClause = filters?.status ? { status: filters.status } : {}
    const projects = await prisma.project.findMany({
      where: whereClause,
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

export type ProjectCreateData = {
  name: string
  description?: string | null
  status?: ProjectStatus
  projectCode?: string | null
  clientName?: string | null
  projectType?: ProjectType
  startDate?: Date | null
  endDate?: Date | null
}

/**
 * Creates a new project.
 * @param data An object containing the data for the new project.
 * @returns A promise that resolves to the newly created project object.
 * @throws Throws an error if the database query fails.
 */
export async function createProject(data: ProjectCreateData) {
  try {
    const newProject = await prisma.project.create({
      data,
    })
    return newProject
  } catch (error) {
    console.error('Database Error creating project:', error)
    throw new Error('Failed to create project.')
  }
}

import { ProjectType } from '@prisma/client'

// ... (getAllProjects and createProject functions remain the same)

export type ProjectUpdateData = {
  name?: string
  description?: string | null
  status?: ProjectStatus
  projectCode?: string | null
  clientName?: string | null
  projectType?: ProjectType
  startDate?: Date | null
  endDate?: Date | null
}

/**
 * Updates a specific project with the given data.
 * @param projectId The ID of the project to update.
 * @param data An object containing the fields to update.
 * @returns A promise that resolves to the updated project object.
 * @throws Throws an error if the project is not found or the update fails.
 */
export async function updateProject(projectId: number, data: ProjectUpdateData) {
  try {
    const updatedProject = await prisma.project.update({
      where: {
        id: projectId,
      },
      data,
    })
    return updatedProject
  } catch (error) {
    console.error('Database Error updating project:', error)
    throw new Error('Failed to update project.')
  }
}

// ... (deleteProject function remains the same)

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
