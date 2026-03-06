"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { formatCurrency, formatDate, getStatusColor, cn } from "@/lib/utils";
import { Search, Filter, AlertTriangle, Phone, Truck, CheckCircle, XCircle, X } from "lucide-react";

const statuses = ["ALL", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "NOT_RECEIVED", "RETURNED"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [updateForm, setUpdateForm] = useState({ status: "", trackingNumber: "", shippingCarrier: "" });

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter]);

  async function fetchOrders() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    const res = await fetch(`/api/orders?${params}`);
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
  }

  async function handleStatusUpdate() {
    if (!selectedOrder || !updateForm.status) return;
    await fetch("/api/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: selectedOrder.id,
        status: updateForm.status,
        trackingNumber: updateForm.trackingNumber || undefined,
        shippingCarrier: updateForm.shippingCarrier || undefined,
      }),
    });
    setSelectedOrder(null);
    setUpdateForm({ status: "", trackingNumber: "", shippingCarrier: "" });
    fetchOrders();
  }

  return (
    <div>
      <Header title="Orders" />
      <div className="p-8">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders, customers..."
              className="input-field pl-9 w-72"
            />
          </div>
          <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5 overflow-x-auto">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors",
                  statusFilter === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="table-header">Order</th>
                <th className="table-header">Customer</th>
                <th className="table-header">Status</th>
                <th className="table-header">Total</th>
                <th className="table-header">Profit</th>
                <th className="table-header">Payment</th>
                <th className="table-header">Date</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div>
                      <span className="font-medium text-gray-900">#{order.orderNumber}</span>
                      {order.confirmedByCall && (
                        <Phone className="w-3.5 h-3.5 inline ml-1 text-green-500" />
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div>
                      <span className="text-gray-900">{order.customer?.name}</span>
                      {order.customer?.isBlacklisted && (
                        <span className="ml-2 badge bg-red-100 text-red-700 text-[10px]">
                          BLACKLISTED ({order.customer.nonReceivedCount})
                        </span>
                      )}
                      <p className="text-xs text-gray-400">{order.customer?.phone}</p>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={cn("badge", getStatusColor(order.status))}>
                      {order.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="table-cell font-medium">{formatCurrency(order.total)}</td>
                  <td className="table-cell">
                    <span className={order.profit >= 0 ? "text-green-600" : "text-red-600"}>
                      {formatCurrency(order.profit)}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={cn("badge", getStatusColor(order.paymentStatus))}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="table-cell text-gray-500 text-xs">{formatDate(order.createdAt)}</td>
                  <td className="table-cell">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setUpdateForm({ status: order.status, trackingNumber: order.trackingNumber || "", shippingCarrier: order.shippingCarrier || "" });
                      }}
                      className="text-brand-600 hover:text-brand-700 text-sm font-medium"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">No orders found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Update Order Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Update Order #{selectedOrder.orderNumber}</h3>
                <button onClick={() => setSelectedOrder(null)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {selectedOrder.customer?.isBlacklisted && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-700">Blacklisted Customer!</p>
                    <p className="text-xs text-red-600">
                      This customer has {selectedOrder.customer.nonReceivedCount} non-received orders.
                      Consider confirming this order carefully.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={updateForm.status}
                    onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                    className="input-field"
                  >
                    {statuses.filter(s => s !== "ALL").map(s => (
                      <option key={s} value={s}>{s.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>

                {(updateForm.status === "SHIPPED" || selectedOrder.status === "SHIPPED") && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                      <input
                        value={updateForm.trackingNumber}
                        onChange={(e) => setUpdateForm({ ...updateForm, trackingNumber: e.target.value })}
                        className="input-field"
                        placeholder="Enter tracking number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Carrier</label>
                      <input
                        value={updateForm.shippingCarrier}
                        onChange={(e) => setUpdateForm({ ...updateForm, shippingCarrier: e.target.value })}
                        className="input-field"
                        placeholder="e.g., FedEx, DHL, TCS"
                      />
                    </div>
                  </>
                )}

                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
                  <p>Automated actions on status change:</p>
                  <ul className="mt-1 space-y-0.5 list-disc list-inside">
                    <li><strong>Shipped:</strong> Sends tracking number via WhatsApp & Email</li>
                    <li><strong>Delivered:</strong> Sends thank-you note via WhatsApp & Email</li>
                    <li><strong>Not Received:</strong> Increments non-received count, may blacklist customer</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setSelectedOrder(null)} className="btn-secondary">Cancel</button>
                <button onClick={handleStatusUpdate} className="btn-primary">Update Order</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
