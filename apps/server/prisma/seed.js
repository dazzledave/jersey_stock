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
  console.log('Seed complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
