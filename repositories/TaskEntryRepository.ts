import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Define the type for the input data for a single task entry
// It can optionally have an id if it's an existing entry.
type TaskEntryInput = {
  id?: number;
  date: Date;
  hours: number;
  taskName: string;
  projectId: number;
};

/**
 * Creates or updates a batch of task entries for a specific user.
 * This function uses a transaction to ensure all operations succeed or fail together.
 * @param userId The ID of the user submitting the entries.
 * @param entries An array of task entry objects to be created or updated.
 */
export async function upsertTaskEntries(userId: number, entries: TaskEntryInput[]) {
  const operations = entries.map(entry => {
    const { id, ...data } = entry;
    // Dates from JSON will be strings, so convert them
    const entryData = { ...data, date: new Date(data.date), userId };

    if (id) {
      // If an ID is provided, update the existing entry.
      // We also ensure the user owns this entry.
      return prisma.taskEntry.updateMany({
        where: {
          id,
          userId,
        },
        data: entryData,
      });
    } else {
      // If no ID is provided, create a new entry.
      return prisma.taskEntry.create({
        data: entryData,
      });
    }
  });

  try {
    // Execute all operations in a single transaction
    return await prisma.$transaction(operations);
  } catch (error) {
    console.error('Database Transaction Error:', error);
    throw new Error('Failed to upsert task entries.');
  }
}

/**
 * Fetches all task entries for a specific user within a given week.
 * The week is calculated as Monday to Friday based on the provided date.
 * @param userId The ID of the user.
 * @param date A date within the desired week.
 * @returns A promise that resolves to an array of task entries.
 */
export async function getTaskEntriesForWeek(userId: number, date: Date) {
  const dayOfWeek = date.getDay(); // Sunday = 0, Monday = 1, etc.
  const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const monday = new Date(date);
  monday.setDate(date.getDate() - distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);

  try {
    return await prisma.taskEntry.findMany({
      where: {
        userId,
        date: {
          gte: monday,
          lte: friday,
        },
      },
      orderBy: [
        { date: 'asc' },
        { id: 'asc' },
      ],
    });
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch task entries.');
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
    });
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to delete task entry.');
  }
}
