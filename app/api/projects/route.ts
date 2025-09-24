import { NextResponse } from 'next/server';
import { getAllProjects } from '@/repositories/ProjectRepository';

export const dynamic = 'force-dynamic'; // Ensures the route is not cached

/**
 * API route handler for GET /api/projects.
 * Fetches and returns all projects.
 */
export async function GET() {
  try {
    const projects = await getAllProjects();
    return NextResponse.json(projects);
  } catch (error) {
    // The repository layer is expected to handle detailed error logging.
    // This route returns a generic error response.
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
