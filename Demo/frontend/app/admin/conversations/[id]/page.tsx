"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, MessageT } from "@/lib/api";
import ChatTranscript from "@/components/ChatTranscript";

export default function ConversationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<MessageT[]>([]);

  useEffect(() => {
    api.get<MessageT[]>(`/api/conversations/${id}/messages`).then(setMessages).catch(() => {});
  }, [id]);

  return (
    <div className="max-w-2xl">
      <Link href="/admin/conversations" className="text-sm text-slate-400 hover:underline">&larr; All conversations</Link>
      <h1 className="mb-6 mt-1 text-2xl font-bold text-slate-900">Transcript</h1>
      <div className="flex h-[70vh] flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <ChatTranscript messages={messages} />
      </div>
    </div>
  );
}
