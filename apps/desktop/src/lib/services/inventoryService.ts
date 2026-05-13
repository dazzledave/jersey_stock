import { prisma } from '../prisma';
import { cloudSyncService } from './cloudSyncService';

export const inventoryService = {
  async updateStock(variantId: string, quantityChange: number, type: string, reason?: string) {
    const inventory = await prisma.$transaction(async (tx) => {
      const updatedInventory = await tx.inventory.update({
        where: { variantId },
        data: {
          quantity: {
            increment: quantityChange
          }
        }
      });

      await tx.stockMovement.create({
        data: {
          variantId,
          quantity: quantityChange,
          type,
          reason
        }
      });

      return updatedInventory;
    });

    cloudSyncService.queueSync('Inventory', variantId).catch(console.error);
    return inventory;
  },

  async setStock(variantId: string, quantity: number) {
    const inventory = await prisma.$transaction(async (tx) => {
      const current = await tx.inventory.findUnique({ where: { variantId } });
      const diff = quantity - (current?.quantity || 0);

      const updatedInventory = await tx.inventory.update({
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

      return updatedInventory;
    });

    cloudSyncService.queueSync('Inventory', variantId).catch(console.error);
    return inventory;
  },

  async getLowStockItems() {
    return await prisma.inventory.findMany({
      where: {
        quantity: {
          lte: 5 
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
