import { prisma } from '@/lib/prisma'

// Define the type for the input data for a weekly task entry.
// It can optionally have an id if it's an existing entry.
export type TaskEntryInput = {
  id?: number
  weekStartDate: Date
  hoursMon?: number
  hoursTue?: number
  hoursWed?: number
  hoursThu?: number
  hoursFri?: number
  taskName: string
  projectId: number
}

/**
 * Creates or updates a batch of weekly task entries for a specific user.
 * This function uses a transaction to ensure all operations succeed or fail together.
 * @param userId The ID of the user submitting the entries.
 * @param entries An array of weekly task entry objects to be created or updated.
 */
export async function upsertTaskEntries(userId: number, entries: TaskEntryInput[]) {
  const operations = entries.map(entry => {
    // The incoming entry from the client might have extra properties like `totalHours`.
    // We create a payload with only the fields that exist in the schema.
    const { weekStartDate, projectId, taskName, hoursMon, hoursTue, hoursWed, hoursThu, hoursFri } = entry

    const weekStartDateObj = new Date(weekStartDate)

    const dataPayload = {
      hoursMon: hoursMon || 0,
      hoursTue: hoursTue || 0,
      hoursWed: hoursWed || 0,
      hoursThu: hoursThu || 0,
      hoursFri: hoursFri || 0,
    }

    return prisma.taskEntry.upsert({
      where: {
        // Use the unique composite key defined in the schema
        userId_projectId_taskName_weekStartDate: {
          userId,
          projectId,
          taskName,
          weekStartDate: weekStartDateObj,
        },
      },
      update: dataPayload, // Use the clean payload
      create: {
        userId,
        weekStartDate: weekStartDateObj,
        projectId,
        taskName,
        ...dataPayload, // Spread the clean payload
      },
    })
  })

  try {
    // Execute all operations in a single transaction
    return await prisma.$transaction(operations)
  } catch (error) {
    console.error('Database Transaction Error:', error)
    throw new Error('Failed to upsert task entries.')
  }
}

/**
 * Fetches all task entries for a specific user within a given week.
 * The week is calculated based on the provided date.
 * @param userId The ID of the user.
 * @param date A date within the desired week.
 * @returns A promise that resolves to an array of task entries.
 */
export async function getTaskEntriesForWeek(userId: number, date: Date) {
  const dayOfWeek = date.getDay() // Sunday = 0, Monday = 1, etc.
  const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1

  const weekStartDate = new Date(date)
  weekStartDate.setDate(date.getDate() - distanceToMonday)
  weekStartDate.setHours(0, 0, 0, 0)

  try {
    return await prisma.taskEntry.findMany({
      where: {
        userId,
        weekStartDate,
      },
      orderBy: { id: 'asc' },
    })
  } catch (error) {
    console.error('Database Error:', error)
    throw new Error('Failed to fetch task entries.')
  }
}

/**
 * Deletes a task entry for a specific user.
 * Ensures that a user can only delete their own entries.
 * @param userId The ID of the user attempting the deletion.
 * @param taskEntryId The ID of the task entry to delete.
 * @returns A promise that resolves to the result of the delete operation.
 */
export async function deleteTaskEntry(userId: number, taskEntryId: number) {
  try {
    // Use deleteMany to ensure both id and userId match.
    // This is a security measure to prevent unauthorized deletions.
    return await prisma.taskEntry.deleteMany({
      where: {
        id: taskEntryId,
        userId: userId,
      },
    })
  } catch (error) {
    console.error('Database Error:', error)
    throw new Error('Failed to delete task entry.')
  }
}

export async function getPreviousTaskNames(userId: number) {
  try {
    const entries = await prisma.taskEntry.findMany({
      select: {
        taskName: true,
      },
      where: {
        userId,
        taskName: {
          not: '',
        },
      },
      orderBy: {
        id: 'desc',
      },
      distinct: ['taskName'],
      take: 15, // Limit the number of suggestions
    })
    return entries.map(e => e.taskName)
  } catch (error) {
    console.error('Database Error:', error)
    throw new Error('Failed to fetch previous task names.')
  }
}
