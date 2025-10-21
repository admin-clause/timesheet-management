import {
  EmployeeStatus,
  EmploymentType,
  LeaveType,
  PrismaClient,
  ProjectStatus,
  ProjectType,
  Role,
} from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function subtractYears(date: Date, years: number) {
  const result = new Date(date)
  result.setFullYear(result.getFullYear() - years)
  return result
}

async function main() {
  console.log(`Start seeding ...`)

  // console.log('Resetting time-off data only')
  // await prisma.timeOffRequestDetails.deleteMany()
  // await prisma.approvalRequest.deleteMany()
  // await prisma.timeOffTransaction.deleteMany()
  // await prisma.timeOffBalance.deleteMany()

  // delete data
  //await prisma.user.deleteMany()
  // reset id
  await prisma.$executeRaw`TRUNCATE TABLE "User" RESTART IDENTITY CASCADE;`

  const projects = [
    {
      name: 'Clause Technology',
      projectCode: 'GEN-001',
      description: 'Non-development tasks such as meetings, admin, training, etc.',
      projectType: ProjectType.GENERAL,
      status: ProjectStatus.ACTIVE,
      startDate: new Date('2024-01-01'),
    },
    {
      name: 'Ethereal',
      projectCode: 'CL-001',
      description: 'Client project for Ethereal Solutions.',
      clientName: 'Ethereal',
      projectType: ProjectType.CLIENT_WORK,
      status: ProjectStatus.ARCHIVED,
      startDate: new Date('2025-03-15'),
      endDate: new Date('2025-10-01'),
    },
    {
      name: 'Hava',
      projectCode: 'IP-001',
      description: 'Internal product development.',
      clientName: 'Hava',
      projectType: ProjectType.INTERNAL_PRODUCT,
      status: ProjectStatus.ACTIVE,
      startDate: new Date('2024-08-01'),
    },
    {
      name: 'Building Code',
      projectCode: 'IP-002',
      description: 'Internal product development.',
      projectType: ProjectType.INTERNAL_PRODUCT,
      status: ProjectStatus.ACTIVE,
      startDate: new Date('2025-04-20'),
    },
  ]

  for (const p of projects) {
    await prisma.project.upsert({
      where: { name: p.name },
      update: p,
      create: p,
    })
  }

  const adminPassword = await bcrypt.hash('admin', 10)
  const userPassword = await bcrypt.hash('123456', 10)

  type AdminSeedData = {
    firstName: string
    lastName: string
    companyEmail: string
    personalEmail: string
  }

  const adminUsers: AdminSeedData[] = [
    {
      firstName: 'Sogol',
      lastName: '',
      companyEmail: 'sogol@clause.tech',
      personalEmail: 'random1@gmail.com',
    },
    {
      firstName: 'Candice',
      lastName: '',
      companyEmail: 'candice@clause.tech',
      personalEmail: 'random2@gmail.com',
    },
    {
      firstName: 'Arnav',
      lastName: '',
      companyEmail: 'arnav@clause.tech',
      personalEmail: 'random3@gmail.com',
    },
  ]
  const adminStartDate = subtractYears(new Date(), 2)
  for (const admin of adminUsers) {
    await prisma.user.upsert({
      where: { companyEmail: admin.companyEmail },
      update: {
        firstName: admin.firstName,
        lastName: admin.lastName,
        password: adminPassword,
        role: Role.ADMIN,
        startDate: adminStartDate,
        personalEmail: admin.personalEmail,
      },
      create: {
        companyEmail: admin.companyEmail,
        firstName: admin.firstName,
        lastName: admin.lastName,
        password: adminPassword,
        role: Role.ADMIN,
        startDate: adminStartDate,
        personalEmail: admin.personalEmail,
      },
    })
  }

  const generalUsers = [
    {
      firstName: 'Edword',
      lastName: 'Li',
      companyEmail: 'edword@clause.tech',
      personalEmail: 'random4@gmail.com',
      phoneNumber: '',
      employmentType: EmploymentType.PERMANENT,
      employeeStatus: EmployeeStatus.WORK_PERMIT,
      fobNumber: '',
      startDate: subtractYears(new Date(), 1),
    },
    {
      firstName: 'Ben',
      lastName: 'Ono',
      companyEmail: 'ben@clause.tech',
      personalEmail: 'bentoki.1213@gmail.com',
      phoneNumber: '672-965-3217',
      employmentType: EmploymentType.PERMANENT,
      employeeStatus: EmployeeStatus.STUDENT_PERMIT,
      fobNumber: '',
      startDate: subtractYears(new Date('2025-06-02'), 1),
    },
    {
      firstName: 'Sumin',
      lastName: 'Leem',
      companyEmail: 'sumin@clause.tech',
      personalEmail: 'random5@gmail.com',
      phoneNumber: '',
      employmentType: EmploymentType.PERMANENT,
      employeeStatus: EmployeeStatus.PR,
      fobNumber: 'FOB103',
      startDate: subtractYears(new Date(), 1),
    },
    {
      firstName: 'Han',
      lastName: 'Nie',
      companyEmail: 'han@clause.tech',
      personalEmail: 'random6@gmail.com',
      phoneNumber: '444-555-6666',
      employmentType: EmploymentType.PERMANENT,
      employeeStatus: EmployeeStatus.CITIZEN,
      fobNumber: 'FOB104',
      startDate: subtractYears(new Date(), 1),
    },
    {
      firstName: 'Douglas',
      lastName: 'Ciole',
      companyEmail: 'douglas@clause.tech',
      personalEmail: 'random7@gmail.com',
      phoneNumber: '555-666-7777',
      employmentType: EmploymentType.CONTRACT,
      employeeStatus: EmployeeStatus.STUDENT_PERMIT,
      fobNumber: 'FOB105',
      startDate: subtractYears(new Date(), 1),
    },
    {
      firstName: 'Shamit',
      lastName: 'Rahman',
      companyEmail: 'shamit@clause.tech',
      personalEmail: 'random8@gmail.com',
      phoneNumber: '666-777-8888',
      employmentType: EmploymentType.PERMANENT,
      employeeStatus: EmployeeStatus.PR,
      fobNumber: 'FOB106',
      startDate: subtractYears(new Date(), 1),
    },
  ]

  for (const user of generalUsers) {
    await prisma.user.upsert({
      where: { companyEmail: user.companyEmail },
      update: {
        ...user,
        password: userPassword,
        role: Role.USER,
      },
      create: {
        ...user,
        password: userPassword,
        role: Role.USER,
      },
    })
  }

  const users = await prisma.user.findMany({ select: { id: true } })
  const leaveTypes: LeaveType[] = [LeaveType.SICK, LeaveType.VACATION]

  for (const user of users) {
    for (const type of leaveTypes) {
      await prisma.timeOffBalance.upsert({
        where: { userId_type: { userId: user.id, type } },
        update: {},
        create: {
          userId: user.id,
          type,
          balance: 0,
        },
      })
    }
  }

  console.log('Seeded time-off balances for all users without transactions or approval requests.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
