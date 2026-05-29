const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const keepId = 'cmp7yx4uo000530v68ytg9j3p'; // 'Ghana wear'
    
    // Find all local products that are not 'Ghana wear'
    const prods = await prisma.product.findMany({
      where: { id: { not: keepId } },
      include: { variants: true }
    });
    
    console.log('Local products to delete:', prods.map(p => p.name));
    
    for (const p of prods) {
      const variantIds = p.variants.map(v => v.id);
      if (variantIds.length > 0) {
        await prisma.stockMovement.deleteMany({ where: { variantId: { in: variantIds } } });
        await prisma.saleItem.deleteMany({ where: { variantId: { in: variantIds } } });
      }
      await prisma.product.delete({ where: { id: p.id } });
    }
    
    console.log('Cleanup complete successfully!');
  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
