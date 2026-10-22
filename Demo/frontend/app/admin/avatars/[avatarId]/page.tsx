"use client";

import { useParams, useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { api, Avatar, ToolConfigT } from "@/lib/api";

export default function AvatarConfigPage() {
  const { avatarId } = useParams<{ avatarId: string }>();
  const router = useRouter();
  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [tools, setTools] = useState<ToolConfigT[]>([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingFace, setUploadingFace] = useState(false);

  function refresh() {
    api.get<Avatar>(`/api/avatars/${avatarId}`).then(setAvatar).catch(() => setError("Avatar not found"));
    api.get<ToolConfigT[]>(`/api/avatars/${avatarId}/tools`).then(setTools).catch(() => {});
  }

  useEffect(refresh, [avatarId]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!avatar) return;
    setError(null);
    try {
      await api.put(`/api/avatars/${avatarId}`, {
        name: avatar.name, role: avatar.role, personality: avatar.personality,
        speaking_style: avatar.speaking_style, greeting: avatar.greeting,
        system_instructions: avatar.system_instructions, is_active: avatar.is_active,
        languages: avatar.languages, voice_id: avatar.voice_id,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function toggleTool(tool: ToolConfigT) {
    const updated = await api.put<ToolConfigT>(`/api/avatars/${avatarId}/tools/${tool.tool_name}`, { is_enabled: !tool.is_enabled });
    setTools((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  async function onUploadFace(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !avatar) return;
    setUploadingFace(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const updated = await api.postForm<Avatar>(`/api/avatars/${avatarId}/face-image`, form);
      setAvatar(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploadingFace(false);
      e.target.value = "";
    }
  }

  async function onDelete() {
    if (!confirm("Delete this avatar? This cannot be undone.")) return;
    await api.delete(`/api/avatars/${avatarId}`);
    router.push("/admin/avatars");
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!avatar) return <p className="text-slate-400">Loading…</p>;

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">{avatar.name}</h1>
      <p className="mb-6 text-sm capitalize text-slate-500">{avatar.industry.replace("_", " ")} &middot; {avatar.role}</p>

      <form onSubmit={onSave} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Persona</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
            <input value={avatar.name} onChange={(e) => setAvatar({ ...avatar, name: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Role</label>
            <input value={avatar.role} onChange={(e) => setAvatar({ ...avatar, role: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Avatar face photo</label>
          <div className="flex items-center gap-3">
            {avatar.face_image_path && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/static/avatar_faces/${avatar.face_image_path}`}
                alt="Face" className="h-12 w-12 rounded-full object-cover border border-slate-200"
              />
            )}
            <input type="file" accept=".jpg,.jpeg,.png" onChange={onUploadFace} disabled={uploadingFace}
              className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700" />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            A clear front-facing photo. Used to generate a talking-head video clip per reply
            (local, CPU-based Wav2Lip or SadTalker &mdash; fully open-source, no vendor API key).
          </p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Personality</label>
          <input value={avatar.personality} onChange={(e) => setAvatar({ ...avatar, personality: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Speaking style</label>
          <input value={avatar.speaking_style} onChange={(e) => setAvatar({ ...avatar, speaking_style: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Greeting</label>
          <textarea value={avatar.greeting} onChange={(e) => setAvatar({ ...avatar, greeting: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={2} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Agent instructions</label>
          <textarea value={avatar.system_instructions} onChange={(e) => setAvatar({ ...avatar, system_instructions: e.target.value })}
            placeholder="e.g. Always confirm the customer's budget before recommending a product."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={3} />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={avatar.is_active} onChange={(e) => setAvatar({ ...avatar, is_active: e.target.checked })} id="active" />
          <label htmlFor="active" className="text-sm text-slate-600">Active (visible to customers)</label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center gap-3">
          <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Save changes</button>
          {saved && <span className="text-sm text-emerald-600">Saved ✓</span>}
        </div>
      </form>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Tool permissions</h2>
        <div className="space-y-2">
          {tools.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-2.5">
              <span className="text-sm font-medium text-slate-700">{t.tool_name}</span>
              <button
                onClick={() => toggleTool(t)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${t.is_enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
              >
                {t.is_enabled ? "Enabled" : "Disabled"}
              </button>
            </div>
          ))}
          {tools.length === 0 && <p className="text-sm text-slate-400">No tools configured.</p>}
        </div>
      </div>

      <button onClick={onDelete} className="mt-6 text-sm font-medium text-red-500 hover:underline">Delete this avatar</button>
    </div>
  );
}
