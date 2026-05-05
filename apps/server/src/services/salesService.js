const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const salesService = {
  async createSale(data) {
    const { totalAmount, paymentMethod, items, customerId } = data;
    
    return await prisma.$transaction(async (tx) => {
      // 1. Verify all items have enough stock
      for (const item of items) {
        const inventory = await tx.inventory.findUnique({
          where: { variantId: item.variantId }
        });

        if (!inventory || inventory.quantity < (item.quantity || 1)) {
          throw new Error(`Insufficient stock for one or more items.`);
        }
      }

      // 2. Create the sale
      const sale = await tx.sale.create({
        data: {
          totalAmount,
          paymentMethod: paymentMethod.toLowerCase(),
          customerId: customerId || null,
          items: {
            create: items.map(item => ({
              variantId: item.variantId,
              quantity: item.quantity || 1,
              price: item.price || (totalAmount / items.length) // Fallback
            }))
          }
        },
        include: {
          items: true,
          customer: true
        }
      });

      // 2. Update Inventory and record movements for each item
      for (const item of items) {
        const qty = item.quantity || 1;
        if (item.variantId) {
          await tx.inventory.update({
            where: { variantId: item.variantId },
            data: {
              quantity: {
                decrement: qty
              }
            }
          });

          await tx.stockMovement.create({
            data: {
              variantId: item.variantId,
              quantity: -qty,
              type: 'SALE',
              reason: `Sale Ref: ${sale.id}`
            }
          });
        }
      }

      return sale;
    });
  },

  async getAllSales() {
    return await prisma.sale.findMany({
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true
              }
            }
          }
        },
        customer: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }
};

module.exports = salesService;
