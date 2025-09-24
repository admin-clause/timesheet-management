import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

const isAdmin = (session: any): boolean => {
  return session?.user?.role === 'ADMIN';
};

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get('month');

  if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
    return new NextResponse('Bad Request: A valid month parameter (YYYY-MM) is required.', { status: 400 });
  }

  const year = parseInt(monthParam.split('-')[0]);
  const month = parseInt(monthParam.split('-')[1]);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  try {
    const entries = await prisma.taskEntry.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      include: {
        project: true,
        user: true,
      },
    });

    // --- New Pivot Aggregation Logic ---
    const usersMap = new Map();
    const projectsMap = new Map();

    for (const entry of entries) {
      const hours = Number(entry.hours);
      if (!entry.user || !entry.project) continue;

      const userName = entry.user.name || entry.user.email || `User ID: ${entry.userId}`;
      if (!usersMap.has(userName)) {
        usersMap.set(userName, { name: userName, totalHours: 0, hoursByProject: {} });
      }
      const userData = usersMap.get(userName);
      userData.totalHours += hours;
      userData.hoursByProject[entry.projectId] = (userData.hoursByProject[entry.projectId] || 0) + hours;

      if (!projectsMap.has(entry.projectId)) {
        projectsMap.set(entry.projectId, { id: entry.projectId, name: entry.project.name, totalHours: 0 });
      }
      projectsMap.get(entry.projectId).totalHours += hours;
    }

    // --- Format Data for Response ---
    const sortedProjects = Array.from(projectsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    const users = Array.from(usersMap.values());
    const projectTotals: { [projectId: number]: number } = {};
    let grandTotal = 0;

    sortedProjects.forEach(p => {
      projectTotals[p.id] = p.totalHours;
      grandTotal += p.totalHours;
    });

    const pivotData = {
      projects: sortedProjects.map(p => ({ id: p.id, name: p.name })), // For table columns
      users: users, // For table rows
      projectTotals: projectTotals, // For table footer
      grandTotal: grandTotal,
    };

    return NextResponse.json({
      reportPeriod: { year, month },
      pivotData,
    });

  } catch (error) {
    console.error('GET /api/admin/report Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}