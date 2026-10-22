"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { api, Avatar } from "@/lib/api";

const INDUSTRIES = [
  "marketing", "healthcare", "banking_finance", "education", "retail_ecommerce",
  "hospitality", "real_estate", "automotive", "manufacturing", "travel_tourism",
  "hr_recruitment", "customer_support", "government_services", "legal_services",
];

export default function AvatarsPage() {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [role, setRole] = useState("");
  const [greeting, setGreeting] = useState("Hi! How can I help you today?");
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    api.get<Avatar[]>("/api/avatars").then(setAvatars).catch(() => {});
  }

  useEffect(refresh, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/api/avatars", {
        name, industry, role, greeting,
        personality: "Friendly, confident, professional",
        speaking_style: "conversational",
        languages: ["en"],
        system_instructions: "",
        escalation_rules: { low_confidence_threshold: 0.55, keywords: ["human", "agent", "representative"] },
      });
      setShowForm(false);
      setName("");
      setRole("");
      refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Avatars</h1>
        <button onClick={() => setShowForm((s) => !s)} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          {showForm ? "Cancel" : "+ New Avatar"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={onCreate} className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Industry</label>
            <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Role</label>
            <input required value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Marketing Sales Consultant" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Greeting</label>
            <input value={greeting} onChange={(e) => setGreeting(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
          <div className="md:col-span-2">
            <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Create avatar</button>
          </div>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {avatars.map((a) => (
          <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900">{a.name}</div>
                <div className="text-sm capitalize text-slate-500">{a.industry.replace("_", " ")} &middot; {a.role}</div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${a.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                {a.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="mt-3 flex gap-3 text-sm">
              <Link href={`/admin/avatars/${a.id}`} className="font-medium text-brand-600 hover:underline">Configure</Link>
              <Link href={`/avatar/${a.id}`} target="_blank" className="font-medium text-slate-500 hover:underline">Try it &rarr;</Link>
            </div>
          </div>
        ))}
        {avatars.length === 0 && <p className="text-slate-400">No avatars yet. Create one to get started.</p>}
      </div>
    </div>
  );
}
