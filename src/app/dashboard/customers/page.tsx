"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Search, Ban, UserCheck, AlertTriangle, Users, Phone, Mail } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showBlacklisted, setShowBlacklisted] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [search, showBlacklisted]);

  async function fetchCustomers() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (showBlacklisted) params.set("blacklisted", "true");
    const res = await fetch(`/api/customers?${params}`);
    const data = await res.json();
    setCustomers(Array.isArray(data) ? data : []);
  }

  async function toggleBlacklist(customer: any) {
    await fetch("/api/customers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: customer.id,
        isBlacklisted: !customer.isBlacklisted,
        blacklistReason: !customer.isBlacklisted ? "Manual blacklist by seller" : null,
      }),
    });
    fetchCustomers();
  }

  return (
    <div>
      <Header title="Customers" />
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customers..."
                className="input-field pl-9 w-72"
              />
            </div>
            <button
              onClick={() => setShowBlacklisted(!showBlacklisted)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                showBlacklisted ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              <Ban className="w-4 h-4" />
              Blacklisted Only
            </button>
          </div>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="table-header">Customer</th>
                <th className="table-header">Contact</th>
                <th className="table-header">Orders</th>
                <th className="table-header">Total Spent</th>
                <th className="table-header">Non-Received</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.map((c) => (
                <tr key={c.id} className={cn("hover:bg-gray-50", c.isBlacklisted && "bg-red-50/50")}>
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold",
                        c.isBlacklisted ? "bg-red-100 text-red-700" : "bg-brand-100 text-brand-700"
                      )}>
                        {c.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">{c.name}</span>
                        {c.isBlacklisted && (
                          <span className="ml-2 badge bg-red-100 text-red-700 text-[10px]">BLACKLISTED</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="w-3 h-3 text-gray-400" /> {c.phone}
                      </div>
                      {c.email && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Mail className="w-3 h-3" /> {c.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="table-cell font-medium">{c.totalOrders}</td>
                  <td className="table-cell">{formatCurrency(c.totalSpent)}</td>
                  <td className="table-cell">
                    {c.nonReceivedCount > 0 ? (
                      <span className="flex items-center gap-1 text-red-600 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" /> {c.nonReceivedCount}
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <span className={cn("badge", c.isBlacklisted ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700")}>
                      {c.isBlacklisted ? "Blacklisted" : "Active"}
                    </span>
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => toggleBlacklist(c)}
                      className={cn(
                        "flex items-center gap-1 text-sm font-medium",
                        c.isBlacklisted ? "text-green-600 hover:text-green-700" : "text-red-600 hover:text-red-700"
                      )}
                    >
                      {c.isBlacklisted ? (
                        <><UserCheck className="w-3.5 h-3.5" /> Unblock</>
                      ) : (
                        <><Ban className="w-3.5 h-3.5" /> Blacklist</>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
