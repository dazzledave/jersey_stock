import { prisma } from '../prisma';

export const analyticsService = {
  async getSummary() {
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
        const cost = (item.variant as any).product.costPrice || 0;
        totalProfit += (item.price - cost) * item.quantity;
      });
    });

    const allInventory = await prisma.inventory.findMany();
    const lowStockCount = allInventory.filter(i => i.quantity <= i.reorderLevel).length;

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
    // Prevent Date-overflow bug: set day of month to 1 first
    const now = new Date();
    
    // Set up this month and last month boundaries
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    // Fetch all sales for the last 12 months to compute details
    const allSales = await prisma.sale.findMany({
      where: { createdAt: { gte: twelveMonthsAgo } },
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

    const activeSales = allSales.filter(s => !s.isRefunded);

    // Function to calculate core stats for a list of sales
    const calculateStats = (salesList: typeof activeSales) => {
      const revenue = salesList.reduce((sum, s) => sum + s.totalAmount, 0);
      let cost = 0;
      salesList.forEach(s => {
        s.items.forEach(item => {
          cost += ((item.variant?.product?.costPrice || 0) * item.quantity);
        });
      });
      const profit = revenue - cost;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      const transactions = salesList.length;
      const avgBasket = transactions > 0 ? revenue / transactions : 0;

      return { revenue, profit, margin, transactions, avgBasket };
    };

    // 1. Period-over-period Stats
    const thisMonthSales = activeSales.filter(s => s.createdAt >= startOfThisMonth);
    const lastMonthSales = activeSales.filter(s => s.createdAt >= startOfLastMonth && s.createdAt <= endOfLastMonth);

    const currentMonth = calculateStats(thisMonthSales);
    const previousMonth = calculateStats(lastMonthSales);

    // 2. 12-Month Trend (fixed date overflow bug)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendData = Array.from({ length: 12 }).map((_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (11 - i));
      const monthIdx = d.getMonth();
      const monthName = months[monthIdx];
      const year = d.getFullYear();
      
      const salesInMonth = activeSales.filter(s => s.createdAt.getMonth() === monthIdx && s.createdAt.getFullYear() === year);
      const revenue = salesInMonth.reduce((sum, s) => sum + s.totalAmount, 0);
      
      // Calculate profit for this month too
      let cost = 0;
      salesInMonth.forEach(s => {
        s.items.forEach(item => {
          cost += ((item.variant?.product?.costPrice || 0) * item.quantity);
        });
      });
      const profit = revenue - cost;

      return { name: monthName, value: revenue, profit };
    });

    // 3. Category Sales
    const categories = await prisma.category.findMany({
      include: {
        products: {
          include: {
            variants: {
              include: {
                saleItems: {
                  where: { sale: { isRefunded: false } }
                }
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

    // 4. Payment Method Breakdown
    const paymentMethods = ['cash', 'card', 'momo', 'free'];
    const paymentBreakdown = paymentMethods.map(method => {
      const salesWithMethod = activeSales.filter(s => (s.paymentMethod || '').toLowerCase() === method);
      const value = salesWithMethod.reduce((sum, s) => sum + s.totalAmount, 0);
      const count = salesWithMethod.length;
      return { method: method.toUpperCase(), value, count };
    });

    // 5. Hourly & Daily Sales
    const hourlySales = Array.from({ length: 24 }).map((_, hour) => {
      const value = activeSales
        .filter(s => s.createdAt.getHours() === hour)
        .reduce((sum, s) => sum + s.totalAmount, 0);
      return { hour, value };
    });

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailySales = daysOfWeek.map((day, idx) => {
      const value = activeSales
        .filter(s => s.createdAt.getDay() === idx)
        .reduce((sum, s) => sum + s.totalAmount, 0);
      return { day, value };
    });

    // 6. Top Products & Slow Movers
    const allProducts = await prisma.product.findMany({
      include: {
        variants: {
          include: {
            saleItems: {
              include: { sale: true }
            },
            inventory: true
          }
        }
      }
    });

    const productSales = allProducts.map(p => {
      let quantity = 0;
      let revenue = 0;
      let stock = 0;

      p.variants.forEach(v => {
        stock += v.inventory?.quantity || 0;
        v.saleItems.forEach(si => {
          if (!si.sale.isRefunded) {
            quantity += si.quantity;
            revenue += si.price * si.quantity;
          }
        });
      });

      return { name: p.name, quantity, revenue, stock };
    });

    const topProducts = [...productSales]
      .filter(p => p.quantity > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const slowMovers = [...productSales]
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 5);

    // 7. Loss Prevention: refunds and discounts
    const refundedSales = allSales.filter(s => s.isRefunded);
    const refundCount = refundedSales.length;
    const refundAmount = refundedSales.reduce((sum, s) => sum + s.totalAmount, 0);

    const totalDiscounts = activeSales.reduce((sum, s) => sum + (s.discountAmount || 0), 0);
    const potentialRevenue = activeSales.reduce((sum, s) => sum + s.totalAmount, 0) + totalDiscounts;
    const discountPercent = potentialRevenue > 0 ? (totalDiscounts / potentialRevenue) * 100 : 0;

    return {
      currentMonth,
      previousMonth,
      trendData,
      categoryData,
      paymentBreakdown,
      hourlySales,
      dailySales,
      topProducts,
      slowMovers,
      lossPrevention: {
        refundCount,
        refundAmount,
        totalDiscounts,
        discountPercent
      }
    };
  },

  formatChartData(sales: any[]) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result: any = {};
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
