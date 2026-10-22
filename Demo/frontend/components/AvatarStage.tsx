"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { api, API_BASE } from "@/lib/api";

export type AvatarVisualState = "idle" | "listening" | "processing" | "speaking" | "error" | "disconnected";

export interface AvatarStageHandle {
  /** Speaks the given text through the connected clip-based avatar. Resolves false (caller
   * should fall back to browser SpeechSynthesis) if no video provider is available. */
  speak: (text: string) => Promise<boolean>;
}

interface SessionResponse {
  provider: "sadtalker" | "wav2lip" | "static";
  ready: boolean;
  config: {
    image_url?: string;
  };
  error: string | null;
}

const STATE_LABEL: Record<AvatarVisualState, string> = {
  idle: "Idle",
  listening: "Listening…",
  processing: "Thinking…",
  speaking: "Speaking",
  error: "Something went wrong",
  disconnected: "Disconnected",
};

const STATE_COLOR: Record<AvatarVisualState, string> = {
  idle: "bg-slate-400",
  listening: "bg-emerald-500",
  processing: "bg-amber-500",
  speaking: "bg-brand-500",
  error: "bg-red-500",
  disconnected: "bg-slate-300",
};

const AvatarStage = forwardRef<AvatarStageHandle, {
  avatarId: string;
  appearanceImageUrl: string | null;
  faceImagePath: string | null;
  avatarName: string;
  state: AvatarVisualState;
}>(function AvatarStage({ avatarId, appearanceImageUrl, faceImagePath, avatarName, state }, ref) {
  // The real uploaded Wav2Lip/SadTalker source photo doubles as the idle portrait when present
  // -- it's an actual photo, so it's a better default than the generic appearanceImageUrl.
  const idlePhotoUrl = faceImagePath ? `${API_BASE}/static/avatar_faces/${faceImagePath}` : appearanceImageUrl;
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [clipPlaying, setClipPlaying] = useState(false);
  const [renderingClip, setRenderingClip] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const clipUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchSessionWithRetry() {
      // A single failed attempt (e.g. hitting the backend mid-restart) shouldn't permanently
      // strand this page on the static fallback -- retry a few times before giving up.
      const attempts = 4;
      for (let i = 0; i < attempts; i++) {
        try {
          const res = await api.post<SessionResponse>(`/api/avatars/${avatarId}/session`);
          if (!cancelled) setSession(res);
          return;
        } catch {
          if (cancelled) return;
          if (i < attempts - 1) await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }
      if (!cancelled) setSession({ provider: "static", ready: true, config: {}, error: "session request failed" });
    }

    fetchSessionWithRetry();
    return () => {
      cancelled = true;
    };
  }, [avatarId]);

  useImperativeHandle(ref, () => ({
    speak: async (text: string) => {
      if ((session?.provider === "wav2lip" || session?.provider === "sadtalker") && session.ready) {
        return speakViaClip(text);
      }
      return false;
    },
  }), [session]);

  async function speakViaClip(text: string): Promise<boolean> {
    setRenderingClip(true);
    try {
      const resp = await fetch(`${API_BASE}/api/avatars/${avatarId}/speak-clip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!resp.ok) return false;
      const blob = await resp.blob();
      if (blob.size === 0 || !videoRef.current) return false;

      if (clipUrlRef.current) URL.revokeObjectURL(clipUrlRef.current);
      const url = URL.createObjectURL(blob);
      clipUrlRef.current = url;

      const video = videoRef.current;
      video.src = url;
      setClipPlaying(true);
      await video.play().catch(() => {});

      await new Promise<void>((resolve) => {
        video.onended = () => resolve();
        video.onerror = () => resolve();
      });
      setClipPlaying(false);
      return true;
    } finally {
      setRenderingClip(false);
    }
  }

  const showClipVideo = (session?.provider === "wav2lip" || session?.provider === "sadtalker") && session.ready;
  const showVideoEl = showClipVideo && clipPlaying;

  return (
    <div className="relative flex aspect-square w-full max-w-md flex-col items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-brand-100 to-brand-50 shadow-inner">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`h-full w-full object-cover ${showVideoEl ? "" : "hidden"}`}
      />

      {!showVideoEl && (
        <div className={`flex h-40 w-40 items-center justify-center rounded-full bg-white text-5xl font-bold text-brand-700 shadow-lg transition-transform ${state === "speaking" ? "animate-pulse" : ""}`}>
          {idlePhotoUrl && !imageFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={idlePhotoUrl} alt={avatarName} className="h-full w-full rounded-full object-cover"
              onError={() => setImageFailed(true)} />
          ) : (
            avatarName.slice(0, 1)
          )}
        </div>
      )}

      {renderingClip && (
        <span className="absolute max-w-[85%] rounded-full bg-white/90 px-3 py-1 text-center text-xs font-medium text-slate-500 shadow">
          {session?.provider === "sadtalker"
            ? "Rendering high-quality video… (CPU, can take 15-30+ minutes)"
            : "Rendering lip-synced video… (CPU, can take a while)"}
        </span>
      )}

      {!showVideoEl && !renderingClip && (
        <div className={`mt-4 flex gap-1.5 ${state === "speaking" ? "" : "opacity-30"}`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-brand-600" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      )}

      <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium shadow">
        <span className={`h-2 w-2 rounded-full ${STATE_COLOR[state]}`} />
        {STATE_LABEL[state]}
      </div>

      <div className="absolute right-4 top-4 rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {session?.provider === "sadtalker" && "Open-source avatar (SadTalker)"}
        {session?.provider === "wav2lip" && "Open-source avatar (Wav2Lip)"}
        {session?.provider === "static" && "Static avatar"}
      </div>
    </div>
  );
});

export default AvatarStage;
