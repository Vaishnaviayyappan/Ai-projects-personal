"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, EscalationT } from "@/lib/api";

export default function EscalationsPage() {
  const [escalations, setEscalations] = useState<EscalationT[]>([]);

  function refresh() {
    api.get<EscalationT[]>("/api/escalations").then(setEscalations).catch(() => {});
  }

  useEffect(refresh, []);

  async function resolve(id: string) {
    await api.post(`/api/escalations/${id}/resolve`);
    refresh();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Human Escalations</h1>
      <div className="space-y-3">
        {escalations.map((e) => (
          <div key={e.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${e.status === "resolved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {e.status}
                </span>
                <span className="ml-2 text-sm font-medium text-slate-800">{e.reason}</span>
                {e.detected_intent && <span className="ml-2 text-xs text-slate-400">intent: {e.detected_intent}</span>}
              </div>
              <div className="flex items-center gap-3">
                <Link href={`/admin/conversations/${e.conversation_id}`} className="text-sm font-medium text-brand-600 hover:underline">View transcript</Link>
                {e.status !== "resolved" && (
                  <button onClick={() => resolve(e.id)} className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700">
                    Mark resolved
                  </button>
                )}
              </div>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-xs text-slate-400 line-clamp-3">{e.transcript_summary}</p>
            <p className="mt-2 text-xs text-slate-400">{new Date(e.created_at).toLocaleString()}</p>
          </div>
        ))}
        {escalations.length === 0 && <p className="text-slate-400">No escalations. 🎉</p>}
      </div>
    </div>
  );
}
