import { LeaveRequestType, LeaveType, Prisma, PrismaClient, Role, TimeOffEntryKind } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function subtractYears(date: Date, years: number) {
  const result = new Date(date)
  result.setFullYear(result.getFullYear() - years)
  return result
}

async function main() {
  console.log(`Start seeding ...`)

  console.log('Clearing tables');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "TimeOffTransaction" RESTART IDENTITY CASCADE;')
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "TimeOffBalance" RESTART IDENTITY CASCADE;')
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Project" RESTART IDENTITY CASCADE;')
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" RESTART IDENTITY CASCADE;')

  await prisma.project.createMany({
    data: [
      { name: 'Clause Technology' },
      { name: 'Ethereal' },
      { name: 'Hava' },
      { name: 'Building Code' },
    ],
  })

  const adminPassword = await bcrypt.hash('admin', 10)
  const userPassword = await bcrypt.hash('123456', 10)

  const adminUsers = [
    { name: 'Sogol', email: 'sogol@clause.tech' },
    { name: 'Candice', email: 'candice@clause.tech' },
    { name: 'Arnav', email: 'arnav@clause.tech' },
  ]
  const adminStartDate = subtractYears(new Date(), 2)
  for (const admin of adminUsers) {
    await prisma.user.create({
      data: {
        email: admin.email,
        name: admin.name,
        password: adminPassword,
        role: Role.ADMIN,
        employmentStartDate: adminStartDate,
      },
    })
  }

  const generalUserNames = ['edword', 'ben', 'sumin', 'han', 'douglas', 'shamit']
  const generalStartDate = subtractYears(new Date(), 1)
  for (const name of generalUserNames) {
    await prisma.user.create({
      data: {
        email: `${name}@clause.tech`,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        password: userPassword,
        role: Role.USER,
        employmentStartDate: generalStartDate,
      },
    })
  }

  const users = await prisma.user.findMany({ select: { id: true } })
  const leaveTypes: LeaveType[] = [LeaveType.SICK, LeaveType.VACATION]
  const requestedTypes: LeaveRequestType[] = [
    LeaveRequestType.SICK,
    LeaveRequestType.VACATION,
    LeaveRequestType.BEREAVEMENT,
    LeaveRequestType.UNPAID,
    LeaveRequestType.MILITARY,
    LeaveRequestType.JURY_DUTY,
    LeaveRequestType.PARENTAL,
    LeaveRequestType.OTHER,
  ]

  for (const user of users) {
    for (const type of leaveTypes) {
      await prisma.timeOffBalance.create({
        data: {
          userId: user.id,
          type,
          balance: new Prisma.Decimal(0),
        },
      })
    }
  }

  for (const user of users) {
    for (const requestedType of requestedTypes) {
      await prisma.timeOffTransaction.create({
        data: {
          userId: user.id,
          type: requestedType === LeaveRequestType.SICK ? LeaveType.SICK : LeaveType.VACATION,
          requestedType,
          kind: TimeOffEntryKind.ADJUSTMENT,
          days: new Prisma.Decimal(0),
          effectiveDate: new Date(),
          note: 'Seed transaction placeholder',
        },
      })
    }
  }

  console.log(`Seeding finished.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
