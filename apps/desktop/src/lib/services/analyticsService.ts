import { prisma } from '../prisma';

export const analyticsService = {
  async getSummary(userId?: string) {
    const now = new Date();
    
    // Set up Boundaries for Today and Yesterday
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);

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

    const activeSales = sales.filter(s => !s.isRefunded);

    // 1. Overall stats
    const totalRevenue = activeSales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalOrders = activeSales.length;
    
    let totalProfit = 0;
    activeSales.forEach(sale => {
      sale.items.forEach(item => {
        const cost = (item.variant as any).product.costPrice || 0;
        totalProfit += (item.price - cost) * item.quantity;
      });
    });

    const allInventory = await prisma.inventory.findMany();
    const lowStockCount = allInventory.filter(i => i.quantity <= i.reorderLevel).length;

    // 2. Today's and Yesterday's Stats
    const todaySalesList = activeSales.filter(s => s.createdAt >= startOfToday);
    const yesterdaySalesList = activeSales.filter(s => s.createdAt >= startOfYesterday && s.createdAt <= endOfYesterday);

    const todaySales = todaySalesList.reduce((sum, s) => sum + s.totalAmount, 0);
    const todayTransactions = todaySalesList.length;

    const yesterdaySales = yesterdaySalesList.reduce((sum, s) => sum + s.totalAmount, 0);
    const yesterdayTransactions = yesterdaySalesList.length;

    // Personal Shift Stats for front-line operators
    let myTodaySales = 0;
    let myTodayTransactions = 0;
    if (userId) {
      const myTodayList = todaySalesList.filter(s => s.userId === userId);
      myTodaySales = myTodayList.reduce((sum, s) => sum + s.totalAmount, 0);
      myTodayTransactions = myTodayList.length;
    }

    // 3. Last 6 transactions (live feed)
    const recentTransactions = await prisma.sale.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
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

    // 4. Top Product Today
    const todayProductsMap: Record<string, { quantity: number; revenue: number }> = {};
    todaySalesList.forEach(s => {
      s.items.forEach(item => {
        const name = item.variant.product.name;
        if (!todayProductsMap[name]) {
          todayProductsMap[name] = { quantity: 0, revenue: 0 };
        }
        todayProductsMap[name].quantity += item.quantity;
        todayProductsMap[name].revenue += item.price * item.quantity;
      });
    });

    const topProductToday = Object.entries(todayProductsMap)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)[0] || null;

    // 5. 7-Day Chart Data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSales = activeSales.filter(s => s.createdAt >= sevenDaysAgo);
    const chartData = this.formatChartData(recentSales);

    return {
      totalRevenue,
      totalProfit,
      totalOrders,
      lowStockCount,
      todaySales,
      todayTransactions,
      yesterdaySales,
      yesterdayTransactions,
      myTodaySales,
      myTodayTransactions,
      recentTransactions,
      topProductToday,
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

  async getDetailedAnalytics(range?: string, customStart?: string, customEnd?: string) {
    const now = new Date();
    let currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    let previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    let previousEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    if (range === 'today') {
      currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      
      previousStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      previousEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    } else if (range === 'week') {
      currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      previousStart = new Date(currentStart.getTime() - 7 * 24 * 60 * 60 * 1000);
      previousStart.setHours(0, 0, 0, 0);
      previousEnd = new Date(currentStart.getTime() - 1);
    } else if (range === 'month') {
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      previousEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (range === 'custom' && customStart && customEnd) {
      currentStart = new Date(customStart);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd = new Date(customEnd);
      currentEnd.setHours(23, 59, 59, 999);

      const durationMs = currentEnd.getTime() - currentStart.getTime();
      previousStart = new Date(currentStart.getTime() - durationMs - 1);
      previousStart.setHours(0, 0, 0, 0);
      previousEnd = new Date(currentStart.getTime() - 1);
    }

    const twelveMonthsAgo = new Date(currentEnd);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const fetchStart = previousStart < twelveMonthsAgo ? previousStart : twelveMonthsAgo;

    // Fetch all sales for the required period
    const allSales = await prisma.sale.findMany({
      where: { createdAt: { gte: fetchStart, lte: currentEnd } },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    category: true
                  }
                }
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
    const thisPeriodSales = activeSales.filter(s => s.createdAt >= currentStart && s.createdAt <= currentEnd);
    const prevPeriodSales = activeSales.filter(s => s.createdAt >= previousStart && s.createdAt <= previousEnd);

    const currentMonth = calculateStats(thisPeriodSales);
    const previousMonth = calculateStats(prevPeriodSales);

    // 2. 12-Month Trend
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendData = Array.from({ length: 12 }).map((_, i) => {
      const d = new Date(currentEnd);
      d.setDate(1);
      d.setMonth(d.getMonth() - (11 - i));
      const monthIdx = d.getMonth();
      const monthName = months[monthIdx];
      const year = d.getFullYear();
      
      const salesInMonth = activeSales.filter(s => s.createdAt.getMonth() === monthIdx && s.createdAt.getFullYear() === year);
      const revenue = salesInMonth.reduce((sum, s) => sum + s.totalAmount, 0);
      
      let cost = 0;
      salesInMonth.forEach(s => {
        s.items.forEach(item => {
          cost += ((item.variant?.product?.costPrice || 0) * item.quantity);
        });
      });
      const profit = revenue - cost;

      return { name: monthName, value: revenue, profit };
    });

    // 3. Category Sales (derived from current period sales for speed and accuracy)
    const categoryMap: Record<string, { revenue: number; quantity: number }> = {};
    thisPeriodSales.forEach(sale => {
      sale.items.forEach(item => {
        const catName = item.variant?.product?.category?.name || 'Uncategorized';
        if (!categoryMap[catName]) {
          categoryMap[catName] = { revenue: 0, quantity: 0 };
        }
        categoryMap[catName].revenue += item.price * item.quantity;
        categoryMap[catName].quantity += item.quantity;
      });
    });
    const categoryData = Object.entries(categoryMap).map(([name, stats]) => ({
      name,
      value: stats.revenue,
      quantity: stats.quantity
    })).filter(c => c.quantity > 0);

    // 4. Payment Method Breakdown (derived from current period sales)
    const paymentMethods = ['cash', 'card', 'momo', 'free'];
    const paymentBreakdown = paymentMethods.map(method => {
      const salesWithMethod = thisPeriodSales.filter(s => (s.paymentMethod || '').toLowerCase() === method);
      const value = salesWithMethod.reduce((sum, s) => sum + s.totalAmount, 0);
      const count = salesWithMethod.length;
      return { method: method.toUpperCase(), value, count };
    });

    // 5. Hourly & Daily Sales (derived from current period sales)
    const hourlySales = Array.from({ length: 24 }).map((_, hour) => {
      const value = thisPeriodSales
        .filter(s => s.createdAt.getHours() === hour)
        .reduce((sum, s) => sum + s.totalAmount, 0);
      return { hour, value };
    });

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailySales = daysOfWeek.map((day, idx) => {
      const value = thisPeriodSales
        .filter(s => s.createdAt.getDay() === idx)
        .reduce((sum, s) => sum + s.totalAmount, 0);
      return { day, value };
    });

    // 6. Top Products & Slow Movers (derived from current period sales for speed & accuracy)
    const allProducts = await prisma.product.findMany({
      include: {
        variants: {
          include: {
            inventory: true
          }
        }
      }
    });

    const productSalesMap: Record<string, { quantity: number; revenue: number }> = {};
    thisPeriodSales.forEach(sale => {
      sale.items.forEach(item => {
        const prodId = item.variant.productId;
        if (!productSalesMap[prodId]) {
          productSalesMap[prodId] = { quantity: 0, revenue: 0 };
        }
        productSalesMap[prodId].quantity += item.quantity;
        productSalesMap[prodId].revenue += item.price * item.quantity;
      });
    });

    const productSales = allProducts.map(p => {
      const sales = productSalesMap[p.id] || { quantity: 0, revenue: 0 };
      const stock = p.variants.reduce((sum, v) => sum + (v.inventory?.quantity || 0), 0);
      return { name: p.name, quantity: sales.quantity, revenue: sales.revenue, stock };
    });

    const topProducts = [...productSales]
      .filter(p => p.quantity > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const slowMovers = [...productSales]
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 5);

    // 7. Loss Prevention: refunds and discounts (derived from current period)
    const refundedSales = allSales.filter(s => s.isRefunded && s.createdAt >= currentStart && s.createdAt <= currentEnd);
    const refundCount = refundedSales.length;
    const refundAmount = refundedSales.reduce((sum, s) => sum + s.totalAmount, 0);

    const totalDiscounts = thisPeriodSales.reduce((sum, s) => sum + (s.discountAmount || 0), 0);
    const potentialRevenue = thisPeriodSales.reduce((sum, s) => sum + s.totalAmount, 0) + totalDiscounts;
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
