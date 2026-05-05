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

  async setStock(variantId, quantity) {
    return await prisma.$transaction(async (tx) => {
      const current = await tx.inventory.findUnique({ where: { variantId } });
      const diff = quantity - (current?.quantity || 0);

      const inventory = await tx.inventory.update({
        where: { variantId },
        data: { quantity }
      });

      await tx.stockMovement.create({
        data: {
          variantId,
          quantity: diff,
          type: 'ADJUSTMENT',
          reason: 'Manual stock update'
        }
      });

      return inventory;
    });
  },

  async getLowStockItems() {
    return await prisma.inventory.findMany({
      where: {
        quantity: {
          lte: 5 // Default reorder level
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
