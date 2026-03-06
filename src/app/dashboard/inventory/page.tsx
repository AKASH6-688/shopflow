"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { formatCurrency } from "@/lib/utils";
import { cn, getStatusColor } from "@/lib/utils";
import { Package, AlertTriangle, Search, Plus, ArrowUpDown } from "lucide-react";

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [movement, setMovement] = useState({ type: "RESTOCK", quantity: 0, reason: "" });

  useEffect(() => {
    fetchInventory();
  }, [search, showLowStock]);

  async function fetchInventory() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (showLowStock) params.set("lowStock", "true");
    const res = await fetch(`/api/inventory?${params}`);
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
  }

  async function handleMovement() {
    if (!selectedItem || movement.quantity <= 0) return;
    await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: selectedItem.productId,
        type: movement.type,
        quantity: movement.quantity,
        reason: movement.reason,
        warehouse: selectedItem.warehouse,
      }),
    });
    setShowModal(false);
    setMovement({ type: "RESTOCK", quantity: 0, reason: "" });
    fetchInventory();
  }

  return (
    <div>
      <Header title="Inventory" />
      <div className="p-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="input-field pl-9 w-72"
              />
            </div>
            <button
              onClick={() => setShowLowStock(!showLowStock)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                showLowStock ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              <AlertTriangle className="w-4 h-4" />
              Low Stock
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="table-header">Product</th>
                <th className="table-header">SKU</th>
                <th className="table-header">Warehouse</th>
                <th className="table-header">Stock</th>
                <th className="table-header">Alert Level</th>
                <th className="table-header">Status</th>
                <th className="table-header">Price</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => {
                const isLow = item.quantity <= item.lowStockAlert;
                const isOut = item.quantity === 0;
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        {item.product.imageUrl ? (
                          <img src={item.product.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <span className="font-medium text-gray-900">{item.product.name}</span>
                      </div>
                    </td>
                    <td className="table-cell text-gray-500">{item.product.sku || "—"}</td>
                    <td className="table-cell">{item.warehouse}</td>
                    <td className="table-cell">
                      <span className={cn("font-semibold", isOut ? "text-red-600" : isLow ? "text-orange-600" : "text-gray-900")}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500">{item.lowStockAlert}</td>
                    <td className="table-cell">
                      <span className={cn("badge", isOut ? "bg-red-100 text-red-700" : isLow ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700")}>
                        {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                      </span>
                    </td>
                    <td className="table-cell">{formatCurrency(item.product.price)}</td>
                    <td className="table-cell">
                      <button
                        onClick={() => { setSelectedItem(item); setShowModal(true); }}
                        className="flex items-center gap-1 text-brand-600 hover:text-brand-700 text-sm font-medium"
                      >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        Adjust
                      </button>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    No inventory items found. Add products first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Stock Adjustment Modal */}
        {showModal && selectedItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Adjust Stock — {selectedItem.product.name}
              </h3>
              <p className="text-sm text-gray-500 mb-4">Current stock: {selectedItem.quantity}</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={movement.type}
                    onChange={(e) => setMovement({ ...movement, type: e.target.value })}
                    className="input-field"
                  >
                    <option value="RESTOCK">Restock (+)</option>
                    <option value="SALE">Sale (-)</option>
                    <option value="RETURN">Return (+)</option>
                    <option value="DAMAGED">Damaged (-)</option>
                    <option value="ADJUSTMENT">Set Exact Amount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={movement.quantity}
                    onChange={(e) => setMovement({ ...movement, quantity: parseInt(e.target.value) || 0 })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                  <input
                    type="text"
                    value={movement.reason}
                    onChange={(e) => setMovement({ ...movement, reason: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Supplier shipment received"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleMovement} className="btn-primary">Apply</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
