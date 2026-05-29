import { prisma } from '../prisma';
import { cloudSyncService } from './cloudSyncService';
import { logActivity } from '../utils/auditLogger';

export const salesService = {
  async createSale(data: any) {
    const {
      totalAmount, paymentMethod, items, customerId,
      userId, soldBy, debtorName, debtorPhone, authorizer, payments,
      discountAmount = 0, discountType = null
    } = data;

    const sale = await prisma.$transaction(async (tx) => {
      let validUserId = null;
      if (userId) {
        const userExists = await tx.user.findUnique({ where: { id: userId } });
        if (userExists) validUserId = userId;
      }

      for (const item of items) {
        const inventory = await tx.inventory.findUnique({
          where: { variantId: item.variantId }
        });

        if (!inventory || inventory.quantity < (item.quantity || 1)) {
          throw new Error(`Insufficient stock for one or more items.`);
        }
      }

      const newSale = await tx.sale.create({
        data: {
          totalAmount,
          paymentMethod: paymentMethod.toLowerCase(),
          customerId: customerId || null,
          userId: validUserId,
          soldBy: soldBy || null,
          debtorName: debtorName || null,
          debtorPhone: debtorPhone || null,
          authorizer: authorizer || null,
          payments: payments ? JSON.stringify(payments) : null,
          discountAmount: parseFloat(discountAmount.toString()) || 0,
          discountType: discountType || null,
          items: {
            create: items.map((item: any) => ({
              variantId: item.variantId,
              quantity: item.quantity || 1,
              price: item.price || (totalAmount / items.length)
            }))
          }
        },
        include: {
          items: true,
          customer: true
        }
      });

      for (const item of items) {
        const qty = item.quantity || 1;
        await tx.inventory.update({
          where: { variantId: item.variantId },
          data: { quantity: { decrement: qty } }
        });

        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            quantity: -qty,
            type: 'SALE',
            reason: `Sale Ref: ${newSale.id}`
          }
        });
      }

      return newSale;
    });

    // Log to Audit Trail
    const detailsMsg = `Completed sale ref: ${sale.id} for amount GH₵${totalAmount.toFixed(2)}.` + 
      (discountAmount > 0 ? ` Applied ${discountType === 'percentage' ? discountAmount + '%' : 'GH₵' + discountAmount} discount.` : '');
    await logActivity(userId, soldBy, "SALE_COMPLETED", detailsMsg);

    cloudSyncService.queueSync('Sale', sale.id).catch(console.error);
    for (const item of sale.items) {
      cloudSyncService.queueSync('SaleItem', item.id).catch(console.error);
      cloudSyncService.queueSync('Inventory', item.variantId).catch(console.error);
    }

    return sale;
  },

  async refundSale(saleId: string, refundedBy: string, reason: string) {
    const sale = await prisma.$transaction(async (tx) => {
      const saleRecord = await tx.sale.findUnique({
        where: { id: saleId },
        include: { items: true }
      });
      if (!saleRecord) throw new Error('Sale not found');
      if (saleRecord.isRefunded) throw new Error('Sale is already refunded');

      const updatedSale = await tx.sale.update({
        where: { id: saleId },
        data: {
          isRefunded: true,
          refundReason: reason
        },
        include: { items: true }
      });

      // Restore inventory levels and log stock movements
      for (const item of saleRecord.items) {
        await tx.inventory.update({
          where: { variantId: item.variantId },
          data: { quantity: { increment: item.quantity } }
        });

        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            quantity: item.quantity,
            type: 'RESTOCK',
            reason: `Refund Ref: ${saleId} | Reason: ${reason}`
          }
        });
      }

      return updatedSale;
    });

    // Log the refund to Audit Trail
    await logActivity(null, refundedBy, "SALE_REFUNDED", `Refunded transaction ref: ${saleId}. Reason: ${reason}`);

    // Queue sync for restored inventory and sale status
    cloudSyncService.queueSync('Sale', saleId).catch(console.error);
    for (const item of sale.items) {
      cloudSyncService.queueSync('Inventory', item.variantId).catch(console.error);
    }

    return sale;
  },

  async getAllSales() {
    const sales = await prisma.sale.findMany({
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

    return sales.map(sale => ({
      ...sale,
      payments: sale.payments ? JSON.parse(sale.payments) : []
    }));
  }
};
