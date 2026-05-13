const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = [
    'Jerseys',
    'Shorts',
    'Socks',
    'Kits',
    'Training Wear',
    'Trophies',
    'Medals',
    'Custom Awards'
  ];

  console.log('Seeding categories...');
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  console.log('Seeding admin user...');
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  console.log('Seed complete. Use admin / admin123 to login.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
