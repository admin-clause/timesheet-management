import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/utils'
import { generateReportExcel, getReportData } from '@/repositories/ReportRepository'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const monthParam = searchParams.get('month')

  if (!monthParam) {
    return new NextResponse('Bad Request: month parameter is required.', { status: 400 })
  }

  try {
    // 1. Get the report data using the shared function
    const reportData = await getReportData(monthParam);
    
    // 2. Generate the Excel file from the retrieved data
    const excelBuffer = await generateReportExcel(reportData);

    // 3. Set headers to inform the browser that this is an Excel file
    const headers = new Headers();
    headers.append('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.append('Content-Disposition', `attachment; filename="report-${monthParam}.xlsx"`);

    // 4. Return the file data and headers as a response
    return new Response(excelBuffer, {
      status: 200,
      headers: headers,
    })
  } catch (error) {
    console.error('GET /api/admin/report/excel Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
