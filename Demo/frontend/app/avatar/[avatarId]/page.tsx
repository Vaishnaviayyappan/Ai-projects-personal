"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { api, Avatar, AgentReply, ConversationT, MessageT } from "@/lib/api";
import AvatarStage, { AvatarStageHandle, AvatarVisualState } from "@/components/AvatarStage";
import Avatar3DPreview from "@/components/Avatar3DPreview";
import ChatTranscript from "@/components/ChatTranscript";
import { useSpeech } from "@/lib/useSpeech";

export default function AvatarInteractionPage() {
  const { avatarId } = useParams<{ avatarId: string }>();
  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [conversation, setConversation] = useState<ConversationT | null>(null);
  const [messages, setMessages] = useState<MessageT[]>([]);
  const [input, setInput] = useState("");
  const [visualState, setVisualState] = useState<AvatarVisualState>("disconnected");
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [error, setError] = useState<string | null>(null);
  const conversationRef = useRef<ConversationT | null>(null);
  const avatarStageRef = useRef<AvatarStageHandle>(null);

  const speech = useSpeech(avatar?.languages?.[0] === "hi" ? "hi-IN" : "en-US");

  useEffect(() => {
    if (!avatarId) return;
    api.get<Avatar>(`/api/avatars/public/${avatarId}`).then(setAvatar).catch(() => setError("Avatar not found"));
  }, [avatarId]);

  useEffect(() => {
    if (!avatar) return;
    api
      .post<ConversationT>("/api/conversations", { avatar_id: avatar.id, user_identifier: "web-visitor", channel: "text" })
      .then(async (conv) => {
        setConversation(conv);
        conversationRef.current = conv;
        setVisualState("idle");
        const msgs = await api.get<MessageT[]>(`/api/conversations/${conv.id}/messages`);
        setMessages(msgs);
      })
      .catch(() => setError("Could not start conversation"));
  }, [avatar]);

  async function sendMessage(content: string) {
    const conv = conversationRef.current;
    if (!conv || !content.trim()) return;
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, role: "user", content, created_at: new Date().toISOString() },
    ]);
    setVisualState("processing");
    try {
      const reply = await api.post<AgentReply>(`/api/conversations/${conv.id}/messages`, { content });
      setMessages((prev) => [...prev, reply.message]);
      setVisualState("speaking");
      const spokenLive = await avatarStageRef.current?.speak(reply.message.content);
      if (spokenLive) {
        setVisualState("idle");
      } else {
        speech.speak(reply.message.content, () => setVisualState("idle"));
      }
    } catch (err) {
      setError((err as Error).message);
      setVisualState("error");
    }
  }

  function handleMicClick() {
    if (speech.listening) {
      speech.stopListening();
      return;
    }
    setVisualState("listening");
    speech.listen((transcript) => {
      setVisualState("processing");
      if (transcript) sendMessage(transcript);
      else setVisualState("idle");
    });
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 text-center">
        <div>
          <p className="text-lg font-semibold text-red-600">{error}</p>
          <Link href="/" className="mt-3 inline-block text-sm text-brand-600 hover:underline">&larr; Back to home</Link>
        </div>
      </main>
    );
  }

  if (!avatar) {
    return <main className="flex min-h-screen items-center justify-center text-slate-400">Loading avatar…</main>;
  }

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <Link href="/" className="text-xs text-slate-400 hover:underline">&larr; Home</Link>
          <h1 className="text-lg font-bold text-slate-900">{avatar.name} &middot; <span className="font-normal text-slate-500">{avatar.role}</span></h1>
        </div>
        <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold capitalize text-brand-700">
          {avatar.industry.replace("_", " ")}
        </span>
      </header>

      <div className="mx-auto grid w-full max-w-5xl flex-1 gap-6 p-6 md:grid-cols-[minmax(0,1fr)_1.2fr]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-1 rounded-full bg-slate-100 p-1 text-sm font-medium">
            <button
              data-testid="view-toggle-2d"
              onClick={() => setViewMode("2d")}
              className={`rounded-full px-4 py-1.5 transition ${viewMode === "2d" ? "bg-white text-brand-700 shadow" : "text-slate-500"}`}
            >
              Talking avatar
            </button>
            <button
              data-testid="view-toggle-3d"
              onClick={() => setViewMode("3d")}
              className={`rounded-full px-4 py-1.5 transition ${viewMode === "3d" ? "bg-white text-brand-700 shadow" : "text-slate-500"}`}
            >
              3D preview
            </button>
          </div>

          {viewMode === "2d" ? (
            <AvatarStage ref={avatarStageRef} avatarId={avatar.id} appearanceImageUrl={avatar.appearance_image_url} faceImagePath={avatar.face_image_path} avatarName={avatar.name} state={visualState} />
          ) : (
            <>
              <Avatar3DPreview />
              <p className="max-w-xs text-center text-[11px] text-slate-400">
                Sample model shown for preview (not generated from this avatar's photo — see README
                for why). 3D model: &ldquo;CesiumMan&rdquo; by Cesium, CC-BY 4.0.
              </p>
            </>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleMicClick}
              disabled={!speech.supported}
              className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white shadow-lg transition ${
                speech.listening ? "bg-red-500 animate-pulse" : "bg-brand-600 hover:bg-brand-700"
              } disabled:opacity-40`}
              title={speech.supported ? "Talk to the avatar" : "Voice not supported in this browser"}
            >
              🎤
            </button>
            {speech.speaking && (
              <button onClick={() => { speech.stopSpeaking(); setVisualState("idle"); }} className="rounded-full bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300">
                Stop speaking
              </button>
            )}
          </div>
          {!speech.supported && (
            <p className="max-w-xs text-center text-xs text-slate-400">
              Voice interaction needs a browser with Web Speech API support (e.g. Chrome). Text chat works everywhere.
            </p>
          )}
        </div>

        <div className="flex min-h-[60vh] flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <ChatTranscript messages={messages} />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="mt-3 flex gap-2 border-t border-slate-100 pt-3"
          >
            <input
              data-testid="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
            <button data-testid="chat-send" type="submit" className="rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700">
              Send
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
