"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { formatCurrency } from "@/lib/utils";
import { Package, Plus, Search, Edit, X } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", sku: "", price: 0, costPrice: 0, comparePrice: 0,
    category: "", description: "", imageUrl: "", initialStock: 0,
    benefits: "",
  });

  useEffect(() => {
    fetchProducts();
  }, [search]);

  async function fetchProducts() {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    const res = await fetch(`/api/products${params}`);
    const data = await res.json();
    setProducts(Array.isArray(data) ? data : []);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        benefits: form.benefits.split(",").map(b => b.trim()).filter(Boolean),
      }),
    });
    setShowForm(false);
    setForm({ name: "", sku: "", price: 0, costPrice: 0, comparePrice: 0, category: "", description: "", imageUrl: "", initialStock: 0, benefits: "" });
    fetchProducts();
  }

  return (
    <div>
      <Header title="Products" />
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
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
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const stock = product.inventoryItems?.reduce((s: number, i: any) => s + i.quantity, 0) || 0;
            return (
              <div key={product.id} className="card overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-12 h-12 text-gray-300" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{product.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{product.category || "Uncategorized"}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(product.price)}</span>
                      {product.comparePrice && (
                        <span className="text-xs text-gray-400 line-through ml-2">{formatCurrency(product.comparePrice)}</span>
                      )}
                    </div>
                    <span className={`badge ${stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {stock > 0 ? `${stock} in stock` : "Out"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>Cost: {formatCurrency(product.costPrice)}</span>
                    <span>Sold: {product.totalSold}</span>
                  </div>
                  {product.sku && <p className="text-xs text-gray-400 mt-1">SKU: {product.sku}</p>}
                </div>
              </div>
            );
          })}
        </div>

        {products.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No products yet. Add your first product or sync from your platform.</p>
          </div>
        )}

        {/* Add Product Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 my-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Product</h3>
                <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                    <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">SKU</label>
                    <input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="input-field" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Price *</label>
                    <input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value) || 0})} className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Cost Price</label>
                    <input type="number" step="0.01" value={form.costPrice} onChange={e => setForm({...form, costPrice: parseFloat(e.target.value) || 0})} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Compare Price</label>
                    <input type="number" step="0.01" value={form.comparePrice} onChange={e => setForm({...form, comparePrice: parseFloat(e.target.value) || 0})} className="input-field" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                    <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Initial Stock</label>
                    <input type="number" value={form.initialStock} onChange={e => setForm({...form, initialStock: parseInt(e.target.value) || 0})} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" rows={2} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Image URL</label>
                  <input value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} className="input-field" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Benefits (comma separated)</label>
                  <input value={form.benefits} onChange={e => setForm({...form, benefits: e.target.value})} className="input-field" placeholder="High quality, Fast shipping, Best price" />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">Create Product</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
