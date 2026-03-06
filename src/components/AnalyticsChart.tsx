"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";

interface DataPoint {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  orders: number;
}

interface AnalyticsChartProps {
  data: DataPoint[];
  loading?: boolean;
  period: string;
  onPeriodChange: (period: string) => void;
}

const periods = [
  { value: "15d", label: "15 Days" },
  { value: "30d", label: "1 Month" },
  { value: "1y", label: "1 Year" },
  { value: "2y", label: "2 Years" },
  { value: "5y", label: "5 Years" },
];

export default function AnalyticsChart({ data, loading, period, onPeriodChange }: AnalyticsChartProps) {
  const [chartType, setChartType] = useState<"area" | "bar">("area");

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-900">Revenue & Profit</h3>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => onPeriodChange(p.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  period === p.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex bg-gray-100 rounded-lg p-0.5 ml-2">
            <button
              onClick={() => setChartType("area")}
              className={`px-2 py-1.5 text-xs rounded-md ${chartType === "area" ? "bg-white shadow-sm" : ""}`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={`px-2 py-1.5 text-xs rounded-md ${chartType === "bar" ? "bg-white shadow-sm" : ""}`}
            >
              Bar
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-80 flex items-center justify-center text-gray-400">Loading chart data...</div>
      ) : data.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-gray-400">No data available for this period</div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          {chartType === "area" ? (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, ""]}
              />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#4263eb" fill="#dbe4ff" strokeWidth={2} name="Revenue" />
              <Area type="monotone" dataKey="profit" stroke="#40c057" fill="#d3f9d8" strokeWidth={2} name="Profit" />
              <Area type="monotone" dataKey="cost" stroke="#fa5252" fill="#ffe3e3" strokeWidth={2} name="Cost" />
            </AreaChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, ""]}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#4263eb" radius={[4, 4, 0, 0]} name="Revenue" />
              <Bar dataKey="profit" fill="#40c057" radius={[4, 4, 0, 0]} name="Profit" />
              <Bar dataKey="cost" fill="#fa5252" radius={[4, 4, 0, 0]} name="Cost" />
            </BarChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
}
