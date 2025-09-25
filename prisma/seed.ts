import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log(`Start seeding ...`)

  console.log('Clear existing projects and reset sequence')
  // TRUNCATE if you want to clearn it up
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Project" RESTART IDENTITY CASCADE;')

  // Create projects
  await prisma.project.createMany({
    data: [
      { name: 'Clause Technology' },
      { name: 'Ethereal' },
      { name: 'Hava' },
      { name: 'Building Code' },
    ],
    skipDuplicates: true,
  })

  // Create users
  const adminPassword = await bcrypt.hash('admin', 10)
  const userPassword = await bcrypt.hash('123456', 10)

  // Admin Users from an array
  const adminUsers = [
    { name: 'Sogol', email: 'sogol@clause.tech' },
    { name: 'Candice', email: 'candice@clause.tech' },
    { name: 'Arnav', email: 'arnav@clause.tech' },
  ]
  for (const admin of adminUsers) {
    await prisma.user.upsert({
      where: { email: admin.email },
      update: {},
      create: {
        email: admin.email,
        name: admin.name,
        password: adminPassword,
        role: 'ADMIN',
      },
    })
  }

  // General Users from an array
  const generalUserNames = ['edword', 'ben', 'sumin', 'han', 'douglas', 'shamit']
  for (const name of generalUserNames) {
    await prisma.user.upsert({
      where: { email: `${name}@clause.tech` },
      update: {},
      create: {
        email: `${name}@clause.tech`,
        name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize first letter
        password: userPassword,
        role: 'USER',
      },
    })
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
