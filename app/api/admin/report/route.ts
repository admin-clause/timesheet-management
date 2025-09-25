import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/utils'
import { getReportData } from '@/repositories/ReportRepository'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const monthParam = searchParams.get('month')

  if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
    return new NextResponse('Bad Request: A valid month parameter (YYYY-MM) is required.', {
      status: 400,
    })
  }

  try {
    const reportData = await getReportData(monthParam)
    return NextResponse.json(reportData)
  } catch (error) {
    console.error('GET /api/admin/report Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
