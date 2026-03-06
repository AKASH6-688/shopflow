"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { formatCurrency } from "@/lib/utils";
import { Trophy, TrendingUp, Package, DollarSign } from "lucide-react";

export default function WinningProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics?type=winning&limit=20")
      .then((r) => r.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <Header title="Winning Products" />
      <div className="p-8">
        <div className="mb-6">
          <p className="text-gray-500 text-sm">
            Products ranked by winning score — based on recent sales velocity, revenue, profit margin, and trend data from the last 30 days.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading winning products...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No product data yet. Start selling to see winning products.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product, index) => (
              <div key={product.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-6">
                  {/* Rank */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                    index === 0 ? "bg-yellow-100 text-yellow-700" :
                    index === 1 ? "bg-gray-100 text-gray-600" :
                    index === 2 ? "bg-orange-100 text-orange-700" :
                    "bg-gray-50 text-gray-400"
                  }`}>
                    #{index + 1}
                  </div>

                  {/* Product Image */}
                  <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-8 h-8 text-gray-300" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{product.category || "Uncategorized"}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(product.price)}</span>
                      <span className="text-xs text-gray-400">Cost: {formatCurrency(product.costPrice)}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-8 flex-shrink-0">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">30d Sales</p>
                      <p className="text-lg font-bold text-gray-900">{product.recentSales}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">30d Revenue</p>
                      <p className="text-lg font-bold text-blue-600">{formatCurrency(product.recentRevenue)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">30d Profit</p>
                      <p className={`text-lg font-bold ${product.recentProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(product.recentProfit)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Margin</p>
                      <p className={`text-lg font-bold ${product.margin >= 20 ? "text-green-600" : product.margin >= 10 ? "text-yellow-600" : "text-red-600"}`}>
                        {product.margin}%
                      </p>
                    </div>
                  </div>

                  {/* Win Score */}
                  <div className="text-center flex-shrink-0 pl-6 border-l">
                    <div className="flex items-center gap-1 mb-1">
                      <Trophy className={`w-4 h-4 ${index < 3 ? "text-yellow-500" : "text-gray-400"}`} />
                      <span className="text-xs text-gray-500">Score</span>
                    </div>
                    <p className="text-2xl font-bold text-brand-700">{product.winScore}</p>
                  </div>
                </div>

                {/* Stock warning */}
                {product.stock <= 5 && (
                  <div className="mt-3 pt-3 border-t">
                    <span className="badge bg-orange-100 text-orange-700">
                      ⚠️ Low stock: {product.stock} remaining
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
