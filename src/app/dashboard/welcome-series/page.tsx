"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";
import { Sparkles, Plus, Trash2, Save, Mail, MessageSquare } from "lucide-react";

export default function WelcomeSeriesPage() {
  const [data, setData] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => fetch("/api/welcome-series").then((r) => r.json()).then(setData).catch(() => {});
  useEffect(() => { load(); }, []);

  const blankForm = { name: "", triggerEvent: "signup", incentiveType: "", incentiveValue: "", isActive: true, steps: [{ delayMinutes: 0, channel: "WHATSAPP", subject: "", messageTemplate: "Hi {{name}}! Welcome to our store! 🎉" }] };

  function openNew() { setEditing({ ...blankForm }); setShowForm(true); }
  function openEdit(s: any) { setEditing({ ...s, steps: s.steps.map((st: any) => ({ ...st })) }); setShowForm(true); }

  function addStep() {
    setEditing({ ...editing, steps: [...editing.steps, { delayMinutes: 60, channel: "WHATSAPP", subject: "", messageTemplate: "" }] });
  }
  function removeStep(i: number) {
    setEditing({ ...editing, steps: editing.steps.filter((_: any, idx: number) => idx !== i) });
  }
  function updateStep(i: number, field: string, val: any) {
    const steps = [...editing.steps];
    steps[i] = { ...steps[i], [field]: val };
    setEditing({ ...editing, steps });
  }

  async function save() {
    await fetch("/api/welcome-series", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    setShowForm(false);
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/welcome-series?id=${id}`, { method: "DELETE" });
    load();
  }

  async function toggle(s: any) {
    await fetch("/api/welcome-series", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...s, isActive: !s.isActive }),
    });
    load();
  }

  const series = data?.series || [];
  const stats = data?.enrollmentStats || [];
  const activeEnrollments = stats.find((s: any) => s.status === "active")?._count || 0;
  const completedEnrollments = stats.find((s: any) => s.status === "completed")?._count || 0;

  return (
    <div>
      <Header title="Welcome Series" />
      <div className="p-8">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-4"><p className="text-sm text-gray-500">Active Series</p><p className="text-2xl font-bold">{series.filter((s: any) => s.isActive).length}</p></div>
          <div className="card p-4"><p className="text-sm text-gray-500">Active Enrollments</p><p className="text-2xl font-bold text-brand-600">{activeEnrollments}</p></div>
          <div className="card p-4"><p className="text-sm text-gray-500">Completed</p><p className="text-2xl font-bold text-green-600">{completedEnrollments}</p></div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">Automation Flows</h3>
          <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> New Series</button>
        </div>

        {/* Series list */}
        <div className="space-y-3">
          {series.map((s: any) => (
            <div key={s.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-600" />
                    <h4 className="font-medium text-gray-900">{s.name}</h4>
                    <span className={cn("badge", s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>{s.isActive ? "Active" : "Paused"}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Trigger: {s.triggerEvent} • {s.steps.length} step(s) • {s._count.enrollments} enrolled</p>
                  {s.incentiveType && <p className="text-sm text-brand-600 mt-0.5">Incentive: {s.incentiveType} — {s.incentiveValue}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggle(s)} className="btn-secondary text-xs px-3 py-1">{s.isActive ? "Pause" : "Activate"}</button>
                  <button onClick={() => openEdit(s)} className="btn-secondary text-xs px-3 py-1">Edit</button>
                  <button onClick={() => remove(s.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              {/* Steps preview */}
              <div className="mt-3 flex gap-2 flex-wrap">
                {s.steps.map((step: any, i: number) => (
                  <div key={step.id} className="flex items-center gap-1 text-xs bg-gray-50 rounded-lg px-2 py-1">
                    <span className="font-medium text-gray-700">Step {i + 1}</span>
                    {step.channel === "WHATSAPP" ? <MessageSquare className="w-3 h-3 text-green-600" /> : <Mail className="w-3 h-3 text-blue-600" />}
                    {step.delayMinutes > 0 && <span className="text-gray-400">after {step.delayMinutes >= 60 ? `${Math.round(step.delayMinutes / 60)}h` : `${step.delayMinutes}m`}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {series.length === 0 && <p className="text-center text-gray-400 py-12">No welcome series yet. Create one to start onboarding customers automatically.</p>}
        </div>

        {/* Edit Modal */}
        {showForm && editing && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6">
              <h3 className="text-lg font-semibold mb-4">{editing.id ? "Edit" : "New"} Welcome Series</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input className="input-field" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trigger</label>
                    <select className="input-field" value={editing.triggerEvent} onChange={(e) => setEditing({ ...editing, triggerEvent: e.target.value })}>
                      <option value="signup">New Signup</option>
                      <option value="first_order">First Order</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Incentive Type</label>
                    <select className="input-field" value={editing.incentiveType || ""} onChange={(e) => setEditing({ ...editing, incentiveType: e.target.value || null })}>
                      <option value="">None</option>
                      <option value="discount">Discount</option>
                      <option value="free_shipping">Free Shipping</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Incentive Value</label>
                    <input className="input-field" placeholder="e.g. 10% or WELCOME10" value={editing.incentiveValue || ""} onChange={(e) => setEditing({ ...editing, incentiveValue: e.target.value })} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Steps</label>
                    <button onClick={addStep} className="text-sm text-brand-600 hover:text-brand-700">+ Add Step</button>
                  </div>
                  {editing.steps.map((step: any, i: number) => (
                    <div key={i} className="border rounded-lg p-3 mb-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Step {i + 1}</span>
                        {editing.steps.length > 1 && <button onClick={() => removeStep(i)} className="text-red-500 text-xs">Remove</button>}
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <select className="input-field text-sm" value={step.channel} onChange={(e) => updateStep(i, "channel", e.target.value)}>
                          <option value="WHATSAPP">WhatsApp</option>
                          <option value="EMAIL">Email</option>
                        </select>
                        <input className="input-field text-sm" type="number" placeholder="Delay (min)" value={step.delayMinutes} onChange={(e) => updateStep(i, "delayMinutes", Number(e.target.value))} />
                        {step.channel === "EMAIL" && <input className="input-field text-sm" placeholder="Subject" value={step.subject || ""} onChange={(e) => updateStep(i, "subject", e.target.value)} />}
                      </div>
                      <textarea className="input-field text-sm" rows={2} placeholder="Message template... Use {{name}}, {{discount}}" value={step.messageTemplate} onChange={(e) => updateStep(i, "messageTemplate", e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary">Cancel</button>
                <button onClick={save} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
