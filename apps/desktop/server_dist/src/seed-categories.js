const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany();
  console.log(JSON.stringify(categories, null, 2));
  
  if (categories.length === 0) {
    console.log('Creating default categories...');
    await prisma.category.createMany({
      data: [
        { name: 'Jerseys' },
        { name: 'Training Wear' },
        { name: 'Footwear' },
        { name: 'Accessories' }
      ]
    });
    const newCategories = await prisma.category.findMany();
    console.log('Categories created:', JSON.stringify(newCategories, null, 2));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
