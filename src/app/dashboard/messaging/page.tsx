"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { cn, formatDate } from "@/lib/utils";
import { Send, MessageSquare, Mail, Phone, Filter, Plus, X } from "lucide-react";

export default function MessagingPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [channel, setChannel] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({ channel: "WHATSAPP", recipient: "", subject: "", body: "" });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [channel]);

  async function fetchLogs() {
    const params = channel ? `?channel=${channel}` : "";
    const res = await fetch(`/api/messaging${params}`);
    const data = await res.json();
    setLogs(Array.isArray(data) ? data : []);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!form.recipient || !form.body) return;
    setSending(true);
    await fetch("/api/messaging", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSending(false);
    setShowCompose(false);
    setForm({ channel: "WHATSAPP", recipient: "", subject: "", body: "" });
    fetchLogs();
  }

  const channelIcons: Record<string, any> = {
    WHATSAPP: <MessageSquare className="w-4 h-4 text-green-600" />,
    EMAIL: <Mail className="w-4 h-4 text-blue-600" />,
    PHONE_CALL: <Phone className="w-4 h-4 text-purple-600" />,
    SMS: <Send className="w-4 h-4 text-orange-600" />,
  };

  const channelColors: Record<string, string> = {
    WHATSAPP: "bg-green-100 text-green-700",
    EMAIL: "bg-blue-100 text-blue-700",
    PHONE_CALL: "bg-purple-100 text-purple-700",
    SMS: "bg-orange-100 text-orange-700",
  };

  return (
    <div>
      <Header title="Messaging" />
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button onClick={() => setChannel("")} className={cn("btn-secondary", !channel && "bg-gray-200")}>All</button>
            <button onClick={() => setChannel("WHATSAPP")} className={cn("btn-secondary flex items-center gap-1", channel === "WHATSAPP" && "bg-green-100 text-green-700")}>
              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
            </button>
            <button onClick={() => setChannel("EMAIL")} className={cn("btn-secondary flex items-center gap-1", channel === "EMAIL" && "bg-blue-100 text-blue-700")}>
              <Mail className="w-3.5 h-3.5" /> Email
            </button>
            <button onClick={() => setChannel("PHONE_CALL")} className={cn("btn-secondary flex items-center gap-1", channel === "PHONE_CALL" && "bg-purple-100 text-purple-700")}>
              <Phone className="w-3.5 h-3.5" /> Calls
            </button>
          </div>
          <button onClick={() => setShowCompose(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Compose
          </button>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="table-header">Channel</th>
                <th className="table-header">Recipient</th>
                <th className="table-header">Message</th>
                <th className="table-header">Status</th>
                <th className="table-header">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <span className={cn("badge flex items-center gap-1 w-fit", channelColors[log.channel] || "bg-gray-100")}>
                      {channelIcons[log.channel]}
                      {log.channel}
                    </span>
                  </td>
                  <td className="table-cell font-medium">{log.recipient}</td>
                  <td className="table-cell">
                    <p className="truncate max-w-md text-gray-600">{log.body}</p>
                    {log.subject && <p className="text-xs text-gray-400">Subject: {log.subject}</p>}
                  </td>
                  <td className="table-cell">
                    <span className="badge bg-green-100 text-green-700">{log.status}</span>
                  </td>
                  <td className="table-cell text-xs text-gray-500">{formatDate(log.createdAt)}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <Send className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No messages yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Compose Modal */}
        {showCompose && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Send Message</h3>
                <button onClick={() => setShowCompose(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                  <select value={form.channel} onChange={e => setForm({...form, channel: e.target.value})} className="input-field">
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="EMAIL">Email</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {form.channel === "EMAIL" ? "Email Address" : "Phone Number"}
                  </label>
                  <input
                    value={form.recipient}
                    onChange={e => setForm({...form, recipient: e.target.value})}
                    className="input-field"
                    placeholder={form.channel === "EMAIL" ? "user@example.com" : "+1234567890"}
                    required
                  />
                </div>
                {form.channel === "EMAIL" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="input-field" required />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea value={form.body} onChange={e => setForm({...form, body: e.target.value})} className="input-field" rows={4} required />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowCompose(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={sending} className="btn-primary disabled:opacity-50">
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
