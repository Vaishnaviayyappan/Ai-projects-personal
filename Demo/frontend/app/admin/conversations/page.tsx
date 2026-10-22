"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ConversationT } from "@/lib/api";

const STATUS_COLOR: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  ended: "bg-slate-100 text-slate-500",
  escalated: "bg-amber-100 text-amber-700",
};

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationT[]>([]);

  useEffect(() => {
    api.get<ConversationT[]>("/api/conversations").then(setConversations).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Conversations</h1>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Started</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {conversations.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-medium text-slate-800">{c.user_identifier}</td>
                <td className="px-4 py-3 capitalize text-slate-500">{c.channel}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[c.status] || ""}`}>{c.status}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">{new Date(c.started_at).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/conversations/${c.id}`} className="font-medium text-brand-600 hover:underline">View transcript</Link>
                </td>
              </tr>
            ))}
            {conversations.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No conversations yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
