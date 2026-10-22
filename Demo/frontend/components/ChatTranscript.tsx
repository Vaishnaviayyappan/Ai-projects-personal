"use client";

import { useEffect, useRef } from "react";
import { MessageT } from "@/lib/api";

export default function ChatTranscript({ messages }: { messages: MessageT[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex-1 space-y-3 overflow-y-auto px-1 py-2">
      {messages.map((m) => (
        <div key={m.id} data-testid="chat-message" data-role={m.role} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
              m.role === "user" ? "bg-brand-600 text-white" : "bg-white text-slate-800 border border-slate-200"
            }`}
          >
            <p className="whitespace-pre-wrap">{m.content}</p>
            {!!m.tool_calls_json && Array.isArray(m.tool_calls_json) && m.tool_calls_json.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(m.tool_calls_json as { name: string; status: string }[]).map((tc, i) => (
                  <span
                    key={i}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      tc.status === "success" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    🔧 {tc.name}: {tc.status}
                  </span>
                ))}
              </div>
            )}
            {!!m.sources_json && Array.isArray(m.sources_json) && m.sources_json.length > 0 && (
              <div className="mt-2 text-[10px] text-slate-400">
                Sources: {(m.sources_json as { source: string }[]).map((s) => s.source).join(", ")}
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
