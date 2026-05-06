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
    const allInventory = await prisma.inventory.findMany();
    const lowStockCount = allInventory.filter(i => i.quantity <= i.reorderLevel).length;

    // 3. Sales for Chart (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentSales = await prisma.sale.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, totalAmount: true }
    });

    const chartData = this.formatChartData(recentSales);

    return {
      totalRevenue,
      totalProfit,
      totalOrders,
      lowStockCount,
      chartData
    };
  },

  async getInventoryAlerts() {
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

  async getDetailedAnalytics() {
    // 1. Monthly Revenue Trends (Past 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);

    const monthlySales = await prisma.sale.findMany({
      where: { createdAt: { gte: twelveMonthsAgo } },
      select: { totalAmount: true, createdAt: true }
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendData = Array.from({ length: 12 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      const monthIdx = d.getMonth();
      const monthName = months[monthIdx];
      const year = d.getFullYear();
      
      const revenue = monthlySales
        .filter(s => s.createdAt.getMonth() === monthIdx && s.createdAt.getFullYear() === year)
        .reduce((sum, s) => sum + s.totalAmount, 0);

      return { name: monthName, value: revenue };
    });

    // 2. Category Breakdown
    const categories = await prisma.category.findMany({
      include: {
        products: {
          include: {
            variants: {
              include: {
                saleItems: true
              }
            }
          }
        }
      }
    });

    const categoryData = categories.map(cat => {
      const revenue = cat.products.reduce((sum, p) => {
        return sum + p.variants.reduce((vSum, v) => {
          return vSum + v.saleItems.reduce((sSum, si) => sSum + (si.price * si.quantity), 0);
        }, 0);
      }, 0);

      const quantity = cat.products.reduce((sum, p) => {
        return sum + p.variants.reduce((vSum, v) => {
          return vSum + v.saleItems.reduce((sSum, si) => sSum + si.quantity, 0);
        }, 0);
      }, 0);

      return { name: cat.name, value: revenue, quantity };
    }).filter(c => c.quantity > 0);

    return { trendData, categoryData };
  },

  formatChartData(sales) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      result[days[d.getDay()]] = 0;
    }
    sales.forEach(s => {
      const day = days[new Date(s.createdAt).getDay()];
      if (result[day] !== undefined) result[day] += s.totalAmount;
    });
    return Object.entries(result).map(([name, value]) => ({ name, value }));
  }
};

module.exports = analyticsService;
