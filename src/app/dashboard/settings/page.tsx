"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";
import { Settings, Save, RefreshCw, Copy, Check, Globe, Key, Database } from "lucide-react";

const platforms = [
  { value: "SHOPIFY", label: "Shopify", color: "bg-green-100 text-green-700" },
  { value: "WOOCOMMERCE", label: "WooCommerce", color: "bg-purple-100 text-purple-700" },
  { value: "WIX", label: "Wix", color: "bg-blue-100 text-blue-700" },
  { value: "CUSTOM", label: "Custom Store", color: "bg-gray-100 text-gray-700" },
  { value: "OTHER", label: "Other", color: "bg-orange-100 text-orange-700" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [form, setForm] = useState({
    name: "", url: "", platform: "CUSTOM", apiKey: "", apiSecret: "", currency: "USD", timezone: "UTC",
  });
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  useEffect(() => {
    fetch("/api/integrations/settings")
      .then(r => r.json())
      .then(data => {
        setSettings(data);
        setForm({
          name: data.name || "",
          url: data.url || "",
          platform: data.platform || "CUSTOM",
          apiKey: "",
          apiSecret: "",
          currency: data.currency || "USD",
          timezone: data.timezone || "UTC",
        });
      })
      .catch(() => {});
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const body: any = { ...form };
    if (!body.apiKey) delete body.apiKey; // don't overwrite with empty
    if (!body.apiSecret) delete body.apiSecret;

    await fetch("/api/integrations/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
  }

  async function handleSync(syncType: string) {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/integrations/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncType }),
      });
      const data = await res.json();
      setSyncResult(data);
    } catch (e) {
      setSyncResult({ error: "Sync failed" });
    }
    setSyncing(false);
  }

  function copyToken() {
    navigator.clipboard.writeText(settings?.pluginToken || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <Header title="Settings" />
      <div className="p-8 max-w-4xl">
        {/* Store Settings */}
        <form onSubmit={handleSave} className="card p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" /> Store Settings
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store URL</label>
              <input value={form.url} onChange={e => setForm({...form, url: e.target.value})} className="input-field" placeholder="https://mystore.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
              <select value={form.platform} onChange={e => setForm({...form, platform: e.target.value})} className="input-field">
                {platforms.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} className="input-field">
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="PKR">PKR (₨)</option>
                <option value="INR">INR (₹)</option>
                <option value="AED">AED (د.إ)</option>
              </select>
            </div>
          </div>

          <h4 className="font-medium text-gray-900 mt-6 mb-3 flex items-center gap-2">
            <Key className="w-4 h-4" /> Integration Keys
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key {settings?.hasApiKey && <span className="text-green-600">(configured)</span>}
              </label>
              <input
                type="password"
                value={form.apiKey}
                onChange={e => setForm({...form, apiKey: e.target.value})}
                className="input-field"
                placeholder="Enter new API key to update"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Secret</label>
              <input
                type="password"
                value={form.apiSecret}
                onChange={e => setForm({...form, apiSecret: e.target.value})}
                className="input-field"
                placeholder="Enter new API secret to update"
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>

        {/* Plugin Embed Code */}
        <div className="card p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" /> Plugin Embed Code
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Add this script to your store to enable AI customer support chat widget.
          </p>
          <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm relative">
            <code>
              {`<script src="${typeof window !== 'undefined' ? window.location.origin : 'https://your-shopflow.com'}/embed.js" data-token="${settings?.pluginToken || 'YOUR_TOKEN'}"></script>`}
            </code>
            <button onClick={copyToken} className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 rounded text-xs">
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="mt-3 text-xs text-gray-400">
            Plugin Token: <code className="bg-gray-100 px-1 py-0.5 rounded">{settings?.pluginToken || "—"}</code>
          </div>
        </div>

        {/* Sync */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5" /> Data Sync
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Pull latest products and orders from your connected platform.
          </p>
          <div className="flex gap-3">
            <button onClick={() => handleSync("products")} disabled={syncing} className="btn-secondary flex items-center gap-2 disabled:opacity-50">
              <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} /> Sync Products
            </button>
            <button onClick={() => handleSync("orders")} disabled={syncing} className="btn-secondary flex items-center gap-2 disabled:opacity-50">
              <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} /> Sync Orders
            </button>
            <button onClick={() => handleSync("all")} disabled={syncing} className="btn-primary flex items-center gap-2 disabled:opacity-50">
              <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} /> Sync All
            </button>
          </div>
          {syncResult && (
            <div className="mt-4 bg-gray-50 rounded-lg p-3 text-sm">
              {syncResult.error ? (
                <p className="text-red-600">{syncResult.error}</p>
              ) : (
                <div>
                  {syncResult.products && <p>Products: {syncResult.products.synced} of {syncResult.products.total} synced</p>}
                  {syncResult.orders && <p>Orders: {syncResult.orders.synced} of {syncResult.orders.total} synced</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
