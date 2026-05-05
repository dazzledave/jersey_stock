const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const salesService = {
  async createSale(data) {
    const { totalAmount, paymentMethod, items } = data;
    
    return await prisma.$transaction(async (tx) => {
      // 1. Create Sale record
      const sale = await tx.sale.create({
        data: {
          totalAmount,
          paymentMethod: paymentMethod.toLowerCase()
        }
      });

      // 2. Update Inventory for each item
      for (const item of items) {
        // We'd ideally need variantId here. For now, we'll assume the frontend sends it.
        if (item.variantId) {
          await tx.inventory.update({
            where: { variantId: item.variantId },
            data: {
              quantity: {
                decrement: 1 // Assuming qty 1 for now
              }
            }
          });

          await tx.stockMovement.create({
            data: {
              variantId: item.variantId,
              quantity: -1,
              type: 'SALE',
              reason: `Sale ${sale.id}`
            }
          });
        }
      }

      return sale;
    });
  },

  async getAllSales() {
    return await prisma.sale.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }
};

module.exports = salesService;
