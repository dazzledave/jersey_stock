const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const inventoryService = {
  async updateStock(variantId, quantityChange, type, reason) {
    return await prisma.$transaction(async (tx) => {
      // 1. Update Inventory
      const inventory = await tx.inventory.update({
        where: { variantId },
        data: {
          quantity: {
            increment: quantityChange
          }
        }
      });

      // 2. Log Movement
      await tx.stockMovement.create({
        data: {
          variantId,
          quantity: quantityChange,
          type,
          reason
        }
      });

      return inventory;
    });
  },

  async getLowStockItems() {
    return await prisma.inventory.findMany({
      where: {
        quantity: {
          lte: prisma.inventory.fields.reorderLevel
        }
      },
      include: {
        variant: {
          include: {
            product: true
          }
        }
      }
    });
  }
};

module.exports = inventoryService;
