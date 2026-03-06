"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import AnalyticsChart from "@/components/AnalyticsChart";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Percent, BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [period, setPeriod] = useState("30d");
  const [profitLoss, setProfitLoss] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/analytics?type=chart&period=${period}`).then(r => r.json()),
      fetch(`/api/analytics?type=profitloss&period=${period}`).then(r => r.json()),
    ]).then(([chart, pl]) => {
      setChartData(chart);
      setProfitLoss(pl);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [period]);

  return (
    <div>
      <Header title="Analytics" />
      <div className="p-8">
        {/* P&L Summary Cards */}
        {profitLoss && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-gray-500 font-medium">Revenue</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(profitLoss.totalRevenue)}</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span className="text-xs text-gray-500 font-medium">Total Cost</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(profitLoss.totalCost)}</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-xs text-gray-500 font-medium">Net Profit</span>
              </div>
              <p className={`text-xl font-bold ${profitLoss.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(profitLoss.totalProfit)}
              </p>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-1">
                <Percent className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-gray-500 font-medium">Profit Margin</span>
              </div>
              <p className={`text-xl font-bold ${profitLoss.profitMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                {profitLoss.profitMargin}%
              </p>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="w-4 h-4 text-indigo-500" />
                <span className="text-xs text-gray-500 font-medium">Orders</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{profitLoss.totalOrders}</p>
            </div>
          </div>
        )}

        {/* Chart */}
        <AnalyticsChart
          data={chartData}
          loading={loading}
          period={period}
          onPeriodChange={setPeriod}
        />

        {/* Data Table */}
        {chartData.length > 0 && (
          <div className="card mt-8 overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">Detailed Breakdown</h3>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="table-header">Period</th>
                  <th className="table-header">Revenue</th>
                  <th className="table-header">Cost</th>
                  <th className="table-header">Profit</th>
                  <th className="table-header">Orders</th>
                  <th className="table-header">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {chartData.map((dp, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{dp.date}</td>
                    <td className="table-cell">{formatCurrency(dp.revenue)}</td>
                    <td className="table-cell text-red-600">{formatCurrency(dp.cost)}</td>
                    <td className="table-cell">
                      <span className={dp.profit >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                        {formatCurrency(dp.profit)}
                      </span>
                    </td>
                    <td className="table-cell">{dp.orders}</td>
                    <td className="table-cell">
                      {dp.revenue > 0 ? `${((dp.profit / dp.revenue) * 100).toFixed(1)}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
