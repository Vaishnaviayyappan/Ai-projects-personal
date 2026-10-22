"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { api, AnalyticsOverview, Avatar } from "@/lib/api";

// recharts reads randomized IDs at render time, which mismatches between server and client
// render and breaks hydration -- these charts are client-only, so skip SSR for them entirely.
const SimpleBarChart = dynamic(() => import("@/components/SimpleBarChart"), { ssr: false });

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [avatarId, setAvatarId] = useState<string>("");

  useEffect(() => {
    api.get<Avatar[]>("/api/avatars").then(setAvatars).catch(() => {});
  }, []);

  useEffect(() => {
    const query = avatarId ? `?avatar_id=${avatarId}` : "";
    api.get<AnalyticsOverview>(`/api/analytics/overview${query}`).then(setData).catch(() => {});
  }, [avatarId]);

  const intentData = data ? Object.entries(data.most_common_intents).map(([name, value]) => ({ name, value })) : [];
  const toolData = data ? Object.entries(data.tool_usage).map(([name, value]) => ({ name, value })) : [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <select
          value={avatarId}
          onChange={(e) => setAvatarId(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="">All avatars</option>
          {avatars.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {!data ? (
        <p className="text-slate-400">Loading analytics…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Conversations" value={data.total_conversations} />
            <StatCard label="Active users" value={data.active_users} />
            <StatCard label="Resolution rate" value={`${data.resolution_rate_pct}%`} />
            <StatCard label="Escalation rate" value={`${data.escalation_rate_pct}%`} />
            <StatCard label="Avg response latency" value={`${(data.avg_response_latency_ms / 1000).toFixed(1)}s`} />
            <StatCard label="Leads" value={data.total_leads} hint={`${data.lead_conversion_rate_pct}% converted`} />
            <StatCard label="Appointments" value={data.total_appointments} hint={`${data.appointment_conversion_rate_pct}% of conversations`} />
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Most common intents</h2>
              {intentData.length === 0 ? (
                <p className="text-sm text-slate-400">No conversations yet.</p>
              ) : (
                <SimpleBarChart data={intentData} color="#3d5cf5" angledLabels />
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Tool usage</h2>
              {toolData.length === 0 ? (
                <p className="text-sm text-slate-400">No tool calls yet.</p>
              ) : (
                <SimpleBarChart data={toolData} color="#5c82ff" />
              )}
              {data && Object.keys(data.tool_success_rate).length > 0 && (
                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  {Object.entries(data.tool_success_rate).map(([name, rate]) => (
                    <div key={name} className="flex justify-between">
                      <span>{name}</span>
                      <span className="font-medium text-slate-700">{rate}% success</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
