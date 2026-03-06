"use client";

import { useState, useEffect } from "react";
import { MessageSquareText, Plus, Trash2, Pencil, Copy, Search, X, Hash } from "lucide-react";

interface SavedReply {
  id: string;
  name: string;
  shortcut: string;
  content: string;
  category: string;
  usageCount: number;
  createdAt: string;
}

export default function SavedRepliesPage() {
  const [replies, setReplies] = useState<SavedReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  // Form
  const [name, setName] = useState("");
  const [shortcut, setShortcut] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");

  useEffect(() => { loadReplies(); }, []);

  async function loadReplies() {
    const res = await fetch("/api/saved-replies");
    if (res.ok) setReplies(await res.json());
    setLoading(false);
  }

  async function saveReply() {
    const body = editingId
      ? { action: "update", replyId: editingId, name, shortcut, content, category }
      : { name, shortcut, content, category };

    const res = await fetch("/api/saved-replies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setShowModal(false);
      resetForm();
      loadReplies();
    }
  }

  async function deleteReply(id: string) {
    await fetch(`/api/saved-replies?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    loadReplies();
  }

  function editReply(r: SavedReply) {
    setEditingId(r.id);
    setName(r.name);
    setShortcut(r.shortcut);
    setContent(r.content);
    setCategory(r.category);
    setShowModal(true);
  }

  function resetForm() {
    setEditingId(null); setName(""); setShortcut(""); setContent(""); setCategory("General");
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  const categories = ["All", ...Array.from(new Set(replies.map((r) => r.category)))];
  const filtered = replies.filter((r) => {
    if (filterCategory !== "All" && r.category !== filterCategory) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.shortcut.toLowerCase().includes(search.toLowerCase()) && !r.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalUsage = replies.reduce((s, r) => s + r.usageCount, 0);

  if (loading) return <div className="p-8"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saved Replies & Macros</h1>
          <p className="text-gray-500 mt-1">Quick responses with keyboard shortcuts</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Reply
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><MessageSquareText className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-sm text-gray-500">Total Replies</p><p className="text-xl font-bold">{replies.length}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><Hash className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-sm text-gray-500">Categories</p><p className="text-xl font-bold">{categories.length - 1}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><Copy className="w-5 h-5 text-purple-600" /></div>
            <div><p className="text-sm text-gray-500">Total Usage</p><p className="text-xl font-bold">{totalUsage}</p></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search replies..." className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
        </div>
        <div className="flex gap-1">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filterCategory === cat ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{cat}</button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r) => (
          <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-medium text-gray-900">{r.name}</h3>
                {r.shortcut && (
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-gray-100 rounded text-xs font-mono text-gray-600">/{r.shortcut}</span>
                )}
              </div>
              <span className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded text-xs">{r.category}</span>
            </div>
            <p className="text-sm text-gray-600 line-clamp-3 mb-4">{r.content}</p>
            <div className="flex items-center justify-between pt-3 border-t">
              <span className="text-xs text-gray-400">Used {r.usageCount} times</span>
              <div className="flex gap-1">
                <button onClick={() => copyToClipboard(r.content)} className="p-1.5 text-gray-400 hover:text-gray-600" title="Copy"><Copy className="w-3.5 h-3.5" /></button>
                <button onClick={() => editReply(r)} className="p-1.5 text-gray-400 hover:text-blue-600" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => deleteReply(r.id)} className="p-1.5 text-gray-400 hover:text-red-600" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center py-12 text-gray-400">No saved replies found</div>}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{editingId ? "Edit" : "New"} Saved Reply</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Greeting" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shortcut</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/</span>
                    <input value={shortcut} onChange={(e) => setShortcut(e.target.value)} className="w-full border rounded-lg pl-7 pr-3 py-2 text-sm" placeholder="greet" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="General" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Hi {{name}}, thank you for reaching out..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={saveReply} disabled={!name || !content} className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50 text-sm">{editingId ? "Update" : "Create"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
