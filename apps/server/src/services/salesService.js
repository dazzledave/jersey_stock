const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const salesService = {
  async createSale(data) {
    const { totalAmount, paymentMethod, items, customerId } = data;
    
    return await prisma.$transaction(async (tx) => {
      // 1. Create Sale record with items and customer
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
