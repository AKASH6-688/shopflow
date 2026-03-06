"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { cn, formatCurrency } from "@/lib/utils";
import { ShoppingCart, Send, CheckCircle, Clock, AlertTriangle, RefreshCw } from "lucide-react";

export default function AbandonedCartsPage() {
  const [data, setData] = useState<any>(null);
  const [filter, setFilter] = useState("");
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/abandoned-carts${filter ? `?status=${filter}` : ""}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [filter]);

  async function sendReminder(cartId: string) {
    setSending(cartId);
    await fetch("/api/abandoned-carts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send_reminder", cartId }),
    });
    setSending(null);
    // Refresh
    const res = await fetch(`/api/abandoned-carts${filter ? `?status=${filter}` : ""}`);
    setData(await res.json());
  }

  async function markRecovered(cartId: string) {
    await fetch("/api/abandoned-carts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_recovered", cartId }),
    });
    const res = await fetch(`/api/abandoned-carts${filter ? `?status=${filter}` : ""}`);
    setData(await res.json());
  }

  const stats = data?.stats;
  const carts = data?.carts || [];

  return (
    <div>
      <Header title="Abandoned Cart Recovery" />
      <div className="p-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="card p-4">
              <p className="text-sm text-gray-500">Total Abandoned</p>
              <p className="text-2xl font-bold">{stats.totalAbandoned}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-gray-500">Recovered</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalRecovered}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-gray-500">Recovery Rate</p>
              <p className="text-2xl font-bold text-brand-600">{stats.recoveryRate}%</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-gray-500">Revenue Recovered</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.recoveredValue)}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {["", "ABANDONED", "REMINDER_SENT", "RECOVERED", "EXPIRED"].map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={cn("px-3 py-1.5 rounded-lg text-sm font-medium", filter === s ? "bg-brand-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
              {s || "All"}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Customer</th>
                <th className="table-header">Items</th>
                <th className="table-header">Total</th>
                <th className="table-header">Status</th>
                <th className="table-header">Reminders</th>
                <th className="table-header">Abandoned</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {carts.map((cart: any) => (
                <tr key={cart.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <p className="font-medium text-gray-900">{cart.customerName || cart.customer?.name || "Unknown"}</p>
                    <p className="text-xs text-gray-500">{cart.customerPhone || cart.customerEmail || "—"}</p>
                  </td>
                  <td className="table-cell">
                    {(cart.cartItems as any[])?.slice(0, 2).map((item: any, i: number) => (
                      <p key={i} className="text-sm">{item.name} x{item.quantity}</p>
                    ))}
                    {(cart.cartItems as any[])?.length > 2 && <p className="text-xs text-gray-400">+{(cart.cartItems as any[]).length - 2} more</p>}
                  </td>
                  <td className="table-cell font-medium">{formatCurrency(cart.cartTotal)}</td>
                  <td className="table-cell">
                    <span className={cn("badge", cart.status === "RECOVERED" ? "bg-green-100 text-green-700" : cart.status === "REMINDER_SENT" ? "bg-yellow-100 text-yellow-700" : cart.status === "EXPIRED" ? "bg-gray-100 text-gray-500" : "bg-red-100 text-red-700")}>
                      {cart.status}
                    </span>
                  </td>
                  <td className="table-cell">{cart.remindersSent}/3</td>
                  <td className="table-cell text-sm text-gray-500">{new Date(cart.createdAt).toLocaleDateString()}</td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      {cart.status !== "RECOVERED" && cart.status !== "EXPIRED" && (
                        <>
                          <button onClick={() => sendReminder(cart.id)} disabled={sending === cart.id} className="p-1.5 rounded bg-brand-50 text-brand-700 hover:bg-brand-100" title="Send Reminder">
                            {sending === cart.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          </button>
                          <button onClick={() => markRecovered(cart.id)} className="p-1.5 rounded bg-green-50 text-green-700 hover:bg-green-100" title="Mark Recovered">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {carts.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">No abandoned carts found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
