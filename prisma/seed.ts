import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // Create projects
  await prisma.project.createMany({
    data: [
      { name: 'Ethereal' },
      { name: 'Hava' },
      { name: 'Building Code' },
      { name: 'Clause Technology' },
    ],
    skipDuplicates: true,
  });

  // Create users
  const adminPassword = await bcrypt.hash('admin', 10);
  const userPassword = await bcrypt.hash('user', 10);

  await prisma.user.upsert({
    where: { email: 'arnav@clause.tech' },
    update: {},
    create: {
      email: 'arnav@clause.tech',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'user@clause.tech' },
    update: {},
    create: {
      email: 'user@clause.tech',
      name: 'Normal User',
      password: userPassword,
      role: 'USER',
    },
  });

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
