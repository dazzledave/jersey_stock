const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cloudSyncService = require('./cloudSyncService');

const salesService = {
  async createSale(data) {
    const {
      totalAmount, paymentMethod, items, customerId,
      userId, soldBy, debtorName, debtorPhone, authorizer, payments
    } = data;

    // Validate userId exists in DB
    let validUserId = null;
    if (userId) {
      const userExists = await prisma.user.findUnique({ where: { id: userId } });
      if (userExists) validUserId = userId;
    }

    const sale = await prisma.$transaction(async (tx) => {
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
          items: {
            create: items.map(item => ({
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

      // 3. Update Inventory
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

    // Queue for Cloud Sync
    cloudSyncService.queueSync('Sale', sale.id).catch(console.error);
    for (const item of sale.items) {
      cloudSyncService.queueSync('SaleItem', item.id).catch(console.error);
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

module.exports = salesService;
