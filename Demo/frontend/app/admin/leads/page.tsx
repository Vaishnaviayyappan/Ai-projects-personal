"use client";

import { useEffect, useState } from "react";
import { api, LeadT } from "@/lib/api";

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadT[]>([]);

  useEffect(() => {
    api.get<LeadT[]>("/api/leads").then(setLeads).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Leads</h1>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Requirements</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3 font-medium text-slate-800">{l.name || "—"}</td>
                <td className="px-4 py-3 text-slate-500">{l.contact || "—"}</td>
                <td className="max-w-xs truncate px-4 py-3 text-slate-500">{l.requirements || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${l.lead_score >= 60 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {l.lead_score}
                  </span>
                </td>
                <td className="px-4 py-3 capitalize text-slate-500">{l.status}</td>
                <td className="px-4 py-3 text-slate-500">{new Date(l.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">No leads yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
