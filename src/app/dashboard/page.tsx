"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import StatsCard from "@/components/StatsCard";
import AnalyticsChart from "@/components/AnalyticsChart";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  DollarSign,
  ShoppingCart,
  Users,
  AlertTriangle,
  TrendingUp,
  Package,
  Ban,
  BarChart3,
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics?type=summary")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?type=chart&period=${period}`)
      .then((r) => r.json())
      .then((data) => {
        setChartData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  return (
    <div>
      <Header title="Dashboard" />
      <div className="p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Monthly Revenue"
            value={stats ? formatCurrency(stats.monthRevenue) : "--"}
            change={stats ? `${stats.monthOrders} orders this month` : ""}
            changeType="neutral"
            icon={DollarSign}
            iconColor="bg-green-100 text-green-600"
          />
          <StatsCard
            title="Monthly Profit"
            value={stats ? formatCurrency(stats.monthProfit) : "--"}
            change="After all expenses"
            changeType="positive"
            icon={TrendingUp}
            iconColor="bg-blue-100 text-blue-600"
          />
          <StatsCard
            title="Total Orders"
            value={stats ? formatNumber(stats.totalOrders) : "--"}
            change={stats ? `${stats.monthOrders} this month` : ""}
            changeType="neutral"
            icon={ShoppingCart}
            iconColor="bg-purple-100 text-purple-600"
          />
          <StatsCard
            title="Total Customers"
            value={stats ? formatNumber(stats.totalCustomers) : "--"}
            icon={Users}
            iconColor="bg-indigo-100 text-indigo-600"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Revenue"
            value={stats ? formatCurrency(stats.totalRevenue) : "--"}
            icon={BarChart3}
            iconColor="bg-emerald-100 text-emerald-600"
          />
          <StatsCard
            title="Low Stock Items"
            value={stats?.lowStockCount ?? "--"}
            change="Products below threshold"
            changeType={stats?.lowStockCount > 0 ? "negative" : "neutral"}
            icon={Package}
            iconColor="bg-orange-100 text-orange-600"
          />
          <StatsCard
            title="Blacklisted Customers"
            value={stats?.blacklistedCount ?? "--"}
            change="Non-receiving customers"
            changeType={stats?.blacklistedCount > 0 ? "negative" : "neutral"}
            icon={Ban}
            iconColor="bg-red-100 text-red-600"
          />
          <StatsCard
            title="Alerts"
            value={stats ? (stats.lowStockCount + stats.blacklistedCount) : "--"}
            change="Items needing attention"
            changeType="negative"
            icon={AlertTriangle}
            iconColor="bg-yellow-100 text-yellow-600"
          />
        </div>

        {/* Chart */}
        <AnalyticsChart
          data={chartData}
          loading={loading}
          period={period}
          onPeriodChange={setPeriod}
        />
      </div>
    </div>
  );
}
