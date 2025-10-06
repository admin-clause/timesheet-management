import { LeaveType, Prisma, PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function subtractYears(date: Date, years: number) {
  const result = new Date(date)
  result.setFullYear(result.getFullYear() - years)
  return result
}

async function main() {
  console.log(`Start seeding ...`)

  console.log('Clear existing projects and reset sequence');
  // Truncate the table to clear all data and reset the ID sequence.
  // The CASCADE option also removes related records in other tables (e.g., TaskEntry).
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Project" RESTART IDENTITY CASCADE;');

  // Create projects
  await prisma.project.createMany({
    data: [
      { name: 'Clause Technology' },
      { name: 'Ethereal' },
      { name: 'Hava' },
      { name: 'Building Code' },
    ],
    // skipDuplicates is not strictly necessary after TRUNCATE, but left for safety.
    skipDuplicates: true,
  });

  // Create users
  const adminPassword = await bcrypt.hash('admin', 10)
  const userPassword = await bcrypt.hash('123456', 10)

  // Admin Users from an array
  const adminUsers = [
    { name: 'Sogol', email: 'sogol@clause.tech' },
    { name: 'Candice', email: 'candice@clause.tech' },
    { name: 'Arnav', email: 'arnav@clause.tech' },
  ]
  const adminStartDate = subtractYears(new Date(), 2)
  for (const admin of adminUsers) {
    await prisma.user.upsert({
      where: { email: admin.email },
      update: {
        employmentStartDate: adminStartDate,
      },
      create: {
        email: admin.email,
        name: admin.name,
        password: adminPassword,
        role: Role.ADMIN,
        employmentStartDate: adminStartDate,
      },
    })
  }

  // General Users from an array
  const generalUserNames = ['edword', 'ben', 'sumin', 'han', 'douglas', 'shamit']
  const generalStartDate = subtractYears(new Date(), 1)
  for (const name of generalUserNames) {
    await prisma.user.upsert({
      where: { email: `${name}@clause.tech` },
      update: {
        employmentStartDate: generalStartDate,
      },
      create: {
        email: `${name}@clause.tech`,
        name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize first letter
        password: userPassword,
        role: Role.USER,
        employmentStartDate: generalStartDate,
      },
    })
  }

  const users = await prisma.user.findMany({ select: { id: true } })
  const leaveTypes: LeaveType[] = [LeaveType.SICK, LeaveType.VACATION]

  for (const user of users) {
    for (const type of leaveTypes) {
      await prisma.timeOffBalance.upsert({
        where: {
          userId_type: {
            userId: user.id,
            type,
          },
        },
        update: {},
        create: {
          userId: user.id,
          type,
          balance: new Prisma.Decimal(0),
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
