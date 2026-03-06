"use client";

import { useState, useEffect } from "react";
import { FlaskConical, Plus, Trash2, Trophy, BarChart3, X } from "lucide-react";

interface ABTest {
  id: string;
  name: string;
  variantA: any;
  variantB: any;
  splitPercent: number;
  winnerMetric: string;
  winnerVariant: string | null;
  status: string;
  variantAStats: any;
  variantBStats: any;
  createdAt: string;
  broadcasts: { id: string; name: string; totalSent: number; totalRecipients: number }[];
}

export default function ABTestPage() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [variantAMsg, setVariantAMsg] = useState("");
  const [variantBMsg, setVariantBMsg] = useState("");
  const [splitPercent, setSplitPercent] = useState(50);
  const [winnerMetric, setWinnerMetric] = useState("open_rate");

  useEffect(() => { loadTests(); }, []);

  async function loadTests() {
    const res = await fetch("/api/ab-tests");
    if (res.ok) setTests(await res.json());
    setLoading(false);
  }

  async function createTest() {
    const res = await fetch("/api/ab-tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        variantA: { message: variantAMsg },
        variantB: { message: variantBMsg },
        splitPercent,
        winnerMetric,
      }),
    });
    if (res.ok) {
      setShowModal(false);
      setName(""); setVariantAMsg(""); setVariantBMsg(""); setSplitPercent(50);
      loadTests();
    }
  }

  async function declareWinner(testId: string, variant: string) {
    await fetch("/api/ab-tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "declare_winner", testId, winnerVariant: variant }),
    });
    loadTests();
  }

  async function deleteTest(id: string) {
    await fetch(`/api/ab-tests?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    loadTests();
  }

  const running = tests.filter((t) => t.status === "running").length;
  const completed = tests.filter((t) => t.status === "completed").length;

  if (loading) return <div className="p-8"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">A/B Testing & Insights</h1>
          <p className="text-gray-500 mt-1">Test message variants to optimize engagement</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Test
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><FlaskConical className="w-5 h-5 text-purple-600" /></div>
            <div><p className="text-sm text-gray-500">Total Tests</p><p className="text-xl font-bold">{tests.length}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><BarChart3 className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-sm text-gray-500">Running</p><p className="text-xl font-bold">{running}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><Trophy className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-sm text-gray-500">Completed</p><p className="text-xl font-bold">{completed}</p></div>
          </div>
        </div>
      </div>

      {/* Tests */}
      <div className="space-y-4">
        {tests.map((test) => (
          <div key={test.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-gray-900">{test.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    test.status === "running" ? "bg-blue-100 text-blue-800" :
                    test.status === "completed" ? "bg-green-100 text-green-800" :
                    "bg-gray-100 text-gray-600"
                  }`}>{test.status}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Metric: {test.winnerMetric.replace("_", " ")} • Split: {test.splitPercent}% / {100 - test.splitPercent}%</p>
              </div>
              <button onClick={() => deleteTest(test.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Variant A */}
              <div className={`p-4 rounded-lg border-2 ${test.winnerVariant === "A" ? "border-green-500 bg-green-50" : "border-gray-200"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Variant A</span>
                  {test.winnerVariant === "A" && <Trophy className="w-4 h-4 text-green-600" />}
                </div>
                <p className="text-sm text-gray-600 mb-3">{test.variantA?.message || JSON.stringify(test.variantA)}</p>
                {test.variantAStats && (
                  <div className="flex gap-4 text-xs text-gray-500">
                    {Object.entries(test.variantAStats as Record<string, unknown>).map(([k, v]) => (
                      <span key={k}>{k}: <strong>{String(v)}</strong></span>
                    ))}
                  </div>
                )}
                {test.status === "running" && !test.winnerVariant && (
                  <button onClick={() => declareWinner(test.id, "A")} className="mt-3 text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Declare Winner</button>
                )}
              </div>

              {/* Variant B */}
              <div className={`p-4 rounded-lg border-2 ${test.winnerVariant === "B" ? "border-green-500 bg-green-50" : "border-gray-200"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Variant B</span>
                  {test.winnerVariant === "B" && <Trophy className="w-4 h-4 text-green-600" />}
                </div>
                <p className="text-sm text-gray-600 mb-3">{test.variantB?.message || JSON.stringify(test.variantB)}</p>
                {test.variantBStats && (
                  <div className="flex gap-4 text-xs text-gray-500">
                    {Object.entries(test.variantBStats as Record<string, unknown>).map(([k, v]) => (
                      <span key={k}>{k}: <strong>{String(v)}</strong></span>
                    ))}
                  </div>
                )}
                {test.status === "running" && !test.winnerVariant && (
                  <button onClick={() => declareWinner(test.id, "B")} className="mt-3 text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Declare Winner</button>
                )}
              </div>
            </div>

            {test.broadcasts.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs font-medium text-gray-500 mb-2">Linked Broadcasts</p>
                <div className="flex gap-2 flex-wrap">
                  {test.broadcasts.map((b) => (
                    <span key={b.id} className="px-2 py-1 bg-gray-100 rounded text-xs">{b.name} ({b.totalSent} sent)</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {tests.length === 0 && <div className="text-center py-12 text-gray-400 bg-white rounded-xl shadow-sm">No A/B tests yet. Create one to start optimizing.</div>}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">New A/B Test</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Welcome message test" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Variant A Message</label>
                <textarea value={variantAMsg} onChange={(e) => setVariantAMsg(e.target.value)} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Hi! Welcome to our store..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Variant B Message</label>
                <textarea value={variantBMsg} onChange={(e) => setVariantBMsg(e.target.value)} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Hey there! Check out our deals..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Split (A%)</label>
                  <input type="number" min={10} max={90} value={splitPercent} onChange={(e) => setSplitPercent(parseInt(e.target.value))} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Winner Metric</label>
                  <select value={winnerMetric} onChange={(e) => setWinnerMetric(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="open_rate">Open Rate</option>
                    <option value="click_rate">Click Rate</option>
                    <option value="reply_rate">Reply Rate</option>
                    <option value="conversion_rate">Conversion Rate</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={createTest} disabled={!name || !variantAMsg || !variantBMsg} className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50 text-sm">Create Test</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
