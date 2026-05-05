const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const analyticsService = {
  async getSummary() {
    // 1. Core Metrics
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
        }
      }
    });

    const totalRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalOrders = sales.length;
    
    let totalProfit = 0;
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const cost = item.variant.product.costPrice || 0;
        totalProfit += (item.price - cost) * item.quantity;
      });
    });

    // 2. Low Stock Count
    const lowStockCount = await prisma.inventory.count({
      where: {
        quantity: {
          lte: prisma.inventory.reorderLevel // This is a bit tricky with Prisma, usually we compare to a column
        }
      }
    });
    // Correction for Prisma column comparison (if needed)
    const allInventory = await prisma.inventory.findMany();
    const lowStockItems = allInventory.filter(i => i.quantity <= i.reorderLevel);

    // 3. Sales for Chart (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentSales = await prisma.sale.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo }
      },
      select: {
        createdAt: true,
        totalAmount: true
      }
    });

    const chartData = this.formatChartData(recentSales);

    return {
      totalRevenue,
      totalProfit,
      totalOrders,
      lowStockCount: lowStockItems.length,
      chartData
    };
  },

  async getInventoryAlerts() {
    const lowStock = await prisma.inventory.findMany({
      where: {
        quantity: {
          lte: 5 // Default reorder level as proxy or fetch all and filter
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
    
    // Proper filter
    const all = await prisma.inventory.findMany({
       include: {
        variant: {
          include: {
            product: true
          }
        }
      }
    });
    return all.filter(i => i.quantity <= i.reorderLevel);
  },

  formatChartData(sales) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = {};
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      result[days[d.getDay()]] = 0;
    }

    sales.forEach(s => {
      const day = days[new Date(s.createdAt).getDay()];
      if (result[day] !== undefined) {
        result[day] += s.totalAmount;
      }
    });

    return Object.entries(result).map(([name, value]) => ({ name, value }));
  }
};

module.exports = analyticsService;
