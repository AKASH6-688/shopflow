export type Platform = "SHOPIFY" | "WOOCOMMERCE" | "WIX" | "CUSTOM" | "OTHER";
export type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED" | "NOT_RECEIVED";
export type PaymentStatus = "PENDING" | "PAID" | "REFUNDED" | "FAILED";
export type PeriodType = "15d" | "30d" | "1y" | "2y" | "5y";

export interface StoreSettings {
  id: string;
  name: string;
  platform: Platform;
  currency: string;
  timezone: string;
  pluginToken: string;
}

export interface DashboardStats {
  totalOrders: number;
  monthOrders: number;
  totalRevenue: number;
  monthRevenue: number;
  monthProfit: number;
  totalCustomers: number;
  lowStockCount: number;
  blacklistedCount: number;
}

export interface ProductData {
  id: string;
  name: string;
  sku?: string;
  price: number;
  costPrice: number;
  category?: string;
  imageUrl?: string;
  stock: number;
  totalSold: number;
  totalRevenue: number;
}

export interface CustomerData {
  id: string;
  name: string;
  email?: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  nonReceivedCount: number;
  isBlacklisted: boolean;
}

export interface OrderData {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  profit: number;
  customerName: string;
  customerPhone: string;
  trackingNumber?: string;
  confirmedByCall: boolean;
  createdAt: string;
}

export interface ConversationData {
  id: string;
  customerName: string;
  subject?: string;
  status: string;
  isAI: boolean;
  lastMessage?: string;
  messageCount: number;
  updatedAt: string;
}

export interface WinningProduct {
  id: string;
  name: string;
  imageUrl?: string;
  price: number;
  costPrice: number;
  category?: string;
  recentSales: number;
  recentRevenue: number;
  recentProfit: number;
  margin: number;
  stock: number;
  winScore: number;
  totalSold: number;
  totalRevenue: number;
}

export interface AnalyticsDataPoint {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  orders: number;
}
