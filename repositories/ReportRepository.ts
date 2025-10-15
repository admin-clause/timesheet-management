import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'

/**
 * Fetches and processes report data for a given month.
 * @param monthParam The month string in 'YYYY-MM' format.
 * @returns An object containing the report period and the pivoted data.
 */
export async function getReportData(monthParam: string) {
  const year = parseInt(monthParam.split('-')[0])
  const month = parseInt(monthParam.split('-')[1])
  const monthStartDate = new Date(year, month - 1, 1)
  const monthEndDate = new Date(year, month, 0)

  // To ensure we get all weeks that overlap with the month, we create a slightly larger
  // date range for the query. We look for weeks that start from up to 6 days before
  // the beginning of the month up to the last day of the month.
  const queryStartDate = new Date(year, month - 1, 1 - 6)

  const entries = await prisma.taskEntry.findMany({
    where: { weekStartDate: { gte: queryStartDate, lte: monthEndDate } },
    include: { project: true, user: true },
  })

  // --- Pivot Aggregation Logic ---
  const usersMap = new Map()
  const projectsMap = new Map()
  const dailyHoursFields: (keyof (typeof entries)[0])[] = [
    'hoursMon',
    'hoursTue',
    'hoursWed',
    'hoursThu',
    'hoursFri',
  ]

  for (const entry of entries) {
    if (!entry.user || !entry.project) continue

    for (let i = 0; i < dailyHoursFields.length; i++) {
      const dayDate = new Date(entry.weekStartDate)
      dayDate.setDate(dayDate.getDate() + i)

      // Only include hours for days that are within the selected month
      if (dayDate.getMonth() !== month - 1) {
        continue
      }

      const hours = Number(entry[dailyHoursFields[i]])
      if (hours === 0) continue

      const userName = entry.user.name || entry.user.email || `User ID: ${entry.userId}`
      if (!usersMap.has(userName)) {
        usersMap.set(userName, { name: userName, totalHours: 0, hoursByProject: {} })
      }
      const userData = usersMap.get(userName)
      userData.totalHours += hours
      const projectIdStr = String(entry.projectId)
      userData.hoursByProject[projectIdStr] = (userData.hoursByProject[projectIdStr] || 0) + hours

      if (!projectsMap.has(entry.projectId)) {
        projectsMap.set(entry.projectId, {
          id: entry.projectId,
          name: entry.project.name,
          totalHours: 0,
        })
      }
      projectsMap.get(entry.projectId).totalHours += hours
    }
  }

  // --- Format Data ---
  const sortedProjects = Array.from(projectsMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  )
  const users = Array.from(usersMap.values())
  const projectTotals: { [projectId: string]: number } = {}
  let grandTotal = 0

  sortedProjects.forEach(p => {
    projectTotals[String(p.id)] = p.totalHours
    grandTotal += p.totalHours
  })

  const pivotData = {
    projects: sortedProjects.map(p => ({ id: p.id, name: p.name })), // For table columns
    users: users, // For table rows
    projectTotals: projectTotals, // For table footer
    grandTotal: grandTotal,
  }

  return {
    reportPeriod: { year, month },
    pivotData,
  }
}

/**
 * Generates an Excel buffer from the report's pivot data.
 * @param reportData The processed report data from getReportData.
 * @returns A promise that resolves to a Buffer containing the Excel file.
 */
export async function generateReportExcel(reportData: Awaited<ReturnType<typeof getReportData>>) {
  const { pivotData, reportPeriod } = reportData
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(`Report ${reportPeriod.year}-${reportPeriod.month}`)

  // --- Header Row ---
  const headerRow = ['User']
  pivotData.projects.forEach(p => headerRow.push(p.name))
  headerRow.push('User Total')

  sheet.getRow(1).values = headerRow
  sheet.getRow(1).font = { bold: true }

  // --- Data Rows ---
  pivotData.users.forEach(user => {
    const row: (string | number)[] = [user.name]
    pivotData.projects.forEach(project => {
      row.push(user.hoursByProject[String(project.id)] || 0)
    })
    row.push(user.totalHours)
    sheet.addRow(row)
  })

  // --- Footer Row ---
  const footerRow: (string | number)[] = ['Project Total']
  pivotData.projects.forEach(project => {
    footerRow.push(pivotData.projectTotals[String(project.id)] || 0)
  })

  sheet.addRow(footerRow)
  const totalRow = sheet.lastRow!
  totalRow.font = { bold: true }
  totalRow.getCell(1).font = { bold: true }

  // --- Column Widths ---
  sheet.columns?.forEach(column => {
    column.width = 15
  })
  sheet.getColumn(1).width = 25

  // --- Return Buffer ---
  return await workbook.xlsx.writeBuffer()
}
