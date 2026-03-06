"use client";

import { useState, useEffect } from "react";
import { Send, Plus, Trash2, Users, BarChart3, Mail, MessageSquare, Filter, X } from "lucide-react";

interface Broadcast {
  id: string;
  name: string;
  channel: string;
  subject: string | null;
  messageTemplate: string;
  segmentFilters: any;
  status: string;
  totalRecipients: number;
  totalSent: number;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  sentAt: string | null;
  createdAt: string;
  _count: { recipients: number };
}

export default function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("WHATSAPP");
  const [subject, setSubject] = useState("");
  const [messageTemplate, setMessageTemplate] = useState("");
  const [segmentFilters, setSegmentFilters] = useState<any>({});
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");

  useEffect(() => { loadBroadcasts(); }, []);

  async function loadBroadcasts() {
    const res = await fetch("/api/broadcasts");
    if (res.ok) setBroadcasts(await res.json());
    setLoading(false);
  }

  async function createBroadcast() {
    const res = await fetch("/api/broadcasts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, channel, subject, messageTemplate, segmentFilters, utmSource, utmMedium, utmCampaign }),
    });
    if (res.ok) {
      setShowModal(false);
      resetForm();
      loadBroadcasts();
    }
  }

  async function sendBroadcast(id: string) {
    setSending(id);
    await fetch("/api/broadcasts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", broadcastId: id }),
    });
    setSending(null);
    loadBroadcasts();
  }

  async function deleteBroadcast(id: string) {
    await fetch(`/api/broadcasts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    loadBroadcasts();
  }

  function resetForm() {
    setName(""); setChannel("WHATSAPP"); setSubject(""); setMessageTemplate("");
    setSegmentFilters({}); setUtmSource(""); setUtmMedium(""); setUtmCampaign("");
  }

  const totalSent = broadcasts.reduce((s, b) => s + b.totalSent, 0);
  const drafts = broadcasts.filter((b) => b.status === "DRAFT").length;
  const sentBroadcasts = broadcasts.filter((b) => b.status === "SENT").length;

  if (loading) return <div className="p-8"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Segmented Broadcasts</h1>
          <p className="text-gray-500 mt-1">Send targeted campaigns to customer segments</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Broadcast
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Send className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-sm text-gray-500">Total Broadcasts</p><p className="text-xl font-bold">{broadcasts.length}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><Users className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-sm text-gray-500">Messages Sent</p><p className="text-xl font-bold">{totalSent}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><BarChart3 className="w-5 h-5 text-purple-600" /></div>
            <div><p className="text-sm text-gray-500">Drafts / Sent</p><p className="text-xl font-bold">{drafts} / {sentBroadcasts}</p></div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Campaign</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Channel</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Sent</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">UTM</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {broadcasts.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{b.name}</p>
                  <p className="text-xs text-gray-500 truncate max-w-[200px]">{b.messageTemplate}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-sm">
                    {b.channel === "WHATSAPP" ? <MessageSquare className="w-3 h-3 text-green-600" /> : <Mail className="w-3 h-3 text-blue-600" />}
                    {b.channel}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    b.status === "SENT" ? "bg-green-100 text-green-800" :
                    b.status === "SENDING" ? "bg-yellow-100 text-yellow-800" :
                    "bg-gray-100 text-gray-600"
                  }`}>{b.status}</span>
                </td>
                <td className="px-4 py-3 text-sm">{b.totalSent} / {b.totalRecipients || "—"}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{b.utmCampaign || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {b.status === "DRAFT" && (
                      <button onClick={() => sendBroadcast(b.id)} disabled={sending === b.id}
                        className="text-brand-600 hover:text-brand-700 p-1" title="Send">
                        {sending === b.id ? <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    )}
                    <button onClick={() => deleteBroadcast(b.id)} className="text-red-500 hover:text-red-700 p-1" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {broadcasts.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-gray-400">No broadcasts yet</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">New Broadcast</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Summer Sale" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                  <select value={channel} onChange={(e) => setChannel(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="EMAIL">Email</option>
                  </select>
                </div>
                {channel === "EMAIL" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message Template</label>
                <textarea value={messageTemplate} onChange={(e) => setMessageTemplate(e.target.value)} rows={4} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Hi {{name}}, check out our new deals..." />
                <p className="text-xs text-gray-400 mt-1">Use {"{{name}}"} and {"{{phone}}"} as placeholders</p>
              </div>

              {/* Segment Filters */}
              <div className="space-y-3">
                <div className="flex items-center gap-2"><Filter className="w-4 h-4 text-gray-500" /><span className="text-sm font-medium text-gray-700">Segment Filters</span></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Min Orders</label>
                    <input type="number" value={segmentFilters.minOrders || ""} onChange={(e) => setSegmentFilters({ ...segmentFilters, minOrders: e.target.value ? parseInt(e.target.value) : undefined })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Max Orders</label>
                    <input type="number" value={segmentFilters.maxOrders || ""} onChange={(e) => setSegmentFilters({ ...segmentFilters, maxOrders: e.target.value ? parseInt(e.target.value) : undefined })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Min Spent ($)</label>
                    <input type="number" value={segmentFilters.minSpent || ""} onChange={(e) => setSegmentFilters({ ...segmentFilters, minSpent: e.target.value ? parseFloat(e.target.value) : undefined })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">City</label>
                    <input value={segmentFilters.city || ""} onChange={(e) => setSegmentFilters({ ...segmentFilters, city: e.target.value || undefined })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={segmentFilters.isBlacklisted === false} onChange={(e) => setSegmentFilters({ ...segmentFilters, isBlacklisted: e.target.checked ? false : undefined })} className="rounded border-gray-300" />
                  Exclude blacklisted customers
                </label>
              </div>

              {/* UTM */}
              <div>
                <div className="flex items-center gap-2 mb-2"><BarChart3 className="w-4 h-4 text-gray-500" /><span className="text-sm font-medium text-gray-700">UTM Attribution</span></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-xs text-gray-500 mb-1">Source</label><input value={utmSource} onChange={(e) => setUtmSource(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="shopflow" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Medium</label><input value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="whatsapp" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Campaign</label><input value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="summer_sale" /></div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={createBroadcast} disabled={!name || !messageTemplate} className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50 text-sm">Create Broadcast</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
