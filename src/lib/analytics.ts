import prisma from "./prisma";
import {
  startOfDay,
  subDays,
  subMonths,
  subYears,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  format,
} from "date-fns";

export type PeriodType = "15d" | "30d" | "1y" | "2y" | "5y";

interface DataPoint {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  orders: number;
}

export async function getAnalyticsData(
  storeId: string,
  period: PeriodType
): Promise<DataPoint[]> {
  const now = new Date();
  let startDate: Date;
  let groupBy: "day" | "week" | "month";

  switch (period) {
    case "15d":
      startDate = subDays(now, 15);
      groupBy = "day";
      break;
    case "30d":
      startDate = subMonths(now, 1);
      groupBy = "day";
      break;
    case "1y":
      startDate = subYears(now, 1);
      groupBy = "month";
      break;
    case "2y":
      startDate = subYears(now, 2);
      groupBy = "month";
      break;
    case "5y":
      startDate = subYears(now, 5);
      groupBy = "month";
      break;
    default:
      startDate = subDays(now, 15);
      groupBy = "day";
  }

  const orders = await prisma.order.findMany({
    where: {
      storeId,
      createdAt: { gte: startDate },
      status: { not: "CANCELLED" },
    },
    select: {
      total: true,
      profit: true,
      createdAt: true,
      items: { select: { costPrice: true, quantity: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const expenses = await prisma.expense.findMany({
    where: {
      storeId,
      date: { gte: startDate },
    },
    select: { amount: true, date: true },
  });

  // Generate date intervals
  let intervals: Date[];
  let formatStr: string;

  if (groupBy === "day") {
    intervals = eachDayOfInterval({ start: startDate, end: now });
    formatStr = "MMM dd";
  } else if (groupBy === "week") {
    intervals = eachWeekOfInterval({ start: startDate, end: now });
    formatStr = "MMM dd";
  } else {
    intervals = eachMonthOfInterval({ start: startDate, end: now });
    formatStr = "MMM yyyy";
  }

  const dataPoints: DataPoint[] = intervals.map((intervalDate) => {
    const periodStart = startOfDay(intervalDate);
    let periodEnd: Date;

    if (groupBy === "day") {
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 1);
    } else if (groupBy === "week") {
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 7);
    } else {
      periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const periodOrders = orders.filter(
      (o) => o.createdAt >= periodStart && o.createdAt < periodEnd
    );

    const periodExpenses = expenses.filter(
      (e) => e.date >= periodStart && e.date < periodEnd
    );

    const revenue = periodOrders.reduce((sum, o) => sum + o.total, 0);
    const itemCosts = periodOrders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.costPrice * i.quantity, 0),
      0
    );
    const expenseTotal = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const cost = itemCosts + expenseTotal;

    return {
      date: format(intervalDate, formatStr),
      revenue: Math.round(revenue * 100) / 100,
      cost: Math.round(cost * 100) / 100,
      profit: Math.round((revenue - cost) * 100) / 100,
      orders: periodOrders.length,
    };
  });

  return dataPoints;
}

export async function getStoreSummary(storeId: string) {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);

  const [totalOrders, monthOrders, totalRevenue, monthRevenue, totalCustomers, lowStockCount, blacklistedCount] =
    await Promise.all([
      prisma.order.count({ where: { storeId } }),
      prisma.order.count({ where: { storeId, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.order.aggregate({ where: { storeId, status: { not: "CANCELLED" } }, _sum: { total: true } }),
      prisma.order.aggregate({ where: { storeId, createdAt: { gte: thirtyDaysAgo }, status: { not: "CANCELLED" } }, _sum: { total: true, profit: true } }),
      prisma.customer.count({ where: { storeId } }),
      prisma.inventoryItem.count({ where: { storeId, quantity: { lte: 5 } } }),
      prisma.customer.count({ where: { storeId, isBlacklisted: true } }),
    ]);

  return {
    totalOrders,
    monthOrders,
    totalRevenue: totalRevenue._sum.total || 0,
    monthRevenue: monthRevenue._sum.total || 0,
    monthProfit: monthRevenue._sum.profit || 0,
    totalCustomers,
    lowStockCount,
    blacklistedCount,
  };
}

export async function getWinningProducts(storeId: string, limit = 10) {
  // Calculate winning score based on: sales volume, revenue, profit margin, trend
  const thirtyDaysAgo = subDays(new Date(), 30);

  const products = await prisma.product.findMany({
    where: { storeId, isActive: true },
    include: {
      orderItems: {
        where: { order: { createdAt: { gte: thirtyDaysAgo }, status: { not: "CANCELLED" } } },
        select: { quantity: true, price: true, costPrice: true },
      },
      inventoryItems: { select: { quantity: true } },
    },
  });

  const scored = products.map((p) => {
    const recentSales = p.orderItems.reduce((s, i) => s + i.quantity, 0);
    const recentRevenue = p.orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const recentCost = p.orderItems.reduce((s, i) => s + i.costPrice * i.quantity, 0);
    const recentProfit = recentRevenue - recentCost;
    const margin = recentRevenue > 0 ? recentProfit / recentRevenue : 0;
    const stock = p.inventoryItems.reduce((s, i) => s + i.quantity, 0);

    // Winning score = weighted combination
    const winScore = recentSales * 2 + recentProfit * 0.5 + margin * 100;

    return {
      id: p.id,
      name: p.name,
      imageUrl: p.imageUrl,
      price: p.price,
      costPrice: p.costPrice,
      category: p.category,
      recentSales,
      recentRevenue,
      recentProfit,
      margin: Math.round(margin * 100),
      stock,
      winScore: Math.round(winScore * 100) / 100,
      totalSold: p.totalSold,
      totalRevenue: p.totalRevenue,
    };
  });

  scored.sort((a, b) => b.winScore - a.winScore);
  return scored.slice(0, limit);
}

export async function getProfitLoss(storeId: string, period: PeriodType) {
  const data = await getAnalyticsData(storeId, period);

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalCost = data.reduce((s, d) => s + d.cost, 0);
  const totalProfit = data.reduce((s, d) => s + d.profit, 0);
  const totalOrders = data.reduce((s, d) => s + d.orders, 0);

  return {
    period,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    totalProfit: Math.round(totalProfit * 100) / 100,
    totalOrders,
    profitMargin: totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 10000) / 100 : 0,
    dataPoints: data,
  };
}
