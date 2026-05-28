import { prisma } from './apps/desktop/src/lib/prisma';

async function main() {
  try {
    const products = await prisma.product.findMany({
      include: {
        variants: {
          include: {
            movements: true,
            saleItems: true
          }
        }
      }
    });
    console.log('PRODUCTS in DB:', JSON.stringify(products, null, 2));
  } catch (err) {
    console.error('Error querying DB:', err);
  }
}

main();
