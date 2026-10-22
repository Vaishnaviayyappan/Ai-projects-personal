"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { api, Avatar, KnowledgeSourceT } from "@/lib/api";

const STATUS_COLOR: Record<string, string> = {
  ready: "bg-emerald-100 text-emerald-700",
  processing: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
};

export default function KnowledgePage() {
  const [sources, setSources] = useState<KnowledgeSourceT[]>([]);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [avatarId, setAvatarId] = useState("");
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function refresh() {
    api.get<KnowledgeSourceT[]>("/api/knowledge").then(setSources).catch(() => {});
  }

  useEffect(() => {
    refresh();
    api.get<Avatar[]>("/api/avatars").then(setAvatars).catch(() => {});
  }, []);

  async function onUploadText(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post("/api/knowledge/upload-text", { avatar_id: avatarId || null, name, content });
      setName("");
      setContent("");
      refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onUploadFile(e: FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      if (avatarId) form.append("avatar_id", avatarId);
      await api.postForm("/api/knowledge/upload-file", form);
      if (fileRef.current) fileRef.current.value = "";
      refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this knowledge source and its embeddings?")) return;
    await api.delete(`/api/knowledge/${id}`);
    refresh();
  }

  async function onReindex(id: string) {
    await api.post(`/api/knowledge/${id}/reindex`);
    refresh();
  }

  function avatarName(id: string | null) {
    if (!id) return "Shared (all avatars)";
    return avatars.find((a) => a.id === id)?.name || id;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Knowledge Base</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <form onSubmit={onUploadText} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Add text / FAQ</h2>
          <select value={avatarId} onChange={(e) => setAvatarId(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Shared across all avatars</option>
            {avatars.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <input required placeholder="Source name" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <textarea required placeholder="Paste FAQ / policy / product text…" value={content} onChange={(e) => setContent(e.target.value)} rows={5} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button type="submit" disabled={busy} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
            {busy ? "Processing…" : "Ingest text"}
          </button>
        </form>

        <form onSubmit={onUploadFile} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Upload PDF / DOCX</h2>
          <select value={avatarId} onChange={(e) => setAvatarId(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Shared across all avatars</option>
            {avatars.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button type="submit" disabled={busy} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
            {busy ? "Processing…" : "Upload & index"}
          </button>
          <p className="text-xs text-slate-400">Supports .pdf, .docx, and plain text files.</p>
        </form>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Scope</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Chunks</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sources.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                <td className="px-4 py-3 text-slate-500">{avatarName(s.avatar_id)}</td>
                <td className="px-4 py-3 uppercase text-slate-500">{s.source_type}</td>
                <td className="px-4 py-3 text-slate-500">{s.chunk_count}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[s.status] || "bg-slate-100 text-slate-500"}`}>{s.status}</span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => onReindex(s.id)} className="mr-3 font-medium text-brand-600 hover:underline">Reindex</button>
                  <button onClick={() => onDelete(s.id)} className="font-medium text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {sources.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">No knowledge sources yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
