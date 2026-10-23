"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { REQUIRED_FIELDS, type IdeaFields } from "@/lib/prompt";
import { renderMarkdownLite, recommendationBadge, appNameFrom, slugify } from "@/lib/markdown";

const STORE_KEY = "app-company-os:draft";

const EMPTY: IdeaFields = {
  idea: "",
  problem: "",
  user: "",
  goal: "",
  platform: "iOS + Web",
  features: "",
  competitors: "",
  budget: "",
};

const SAMPLE: IdeaFields = {
  idea: "Type a destination, dates, and vibe → get a day-by-day itinerary you can edit and share.",
  problem: "Trip planning is scattered across 30 browser tabs with no single plan to follow.",
  user: "Solo and couple travelers, 25–40, who plan 2–3 trips a year.",
  goal: "Get someone from a blank idea to a shareable day-by-day plan in one sitting.",
  platform: "iOS + Web",
  features: "",
  competitors: "TripIt, Wanderlog",
  budget: "Solo builder, nights and weekends",
};

type ErrorCode =
  | "missing_api_key"
  | "missing_fields"
  | "bad_request"
  | "empty_completion"
  | "upstream_error"
  | "network_error"
  | "cancelled";

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  missing_api_key: "The server has no Groq API key configured yet — see the README.",
  missing_fields: "Fill in the required fields marked with *.",
  bad_request: "Something in the form confused the request — try again.",
  empty_completion: "No answer came back. Try again with a bit more detail.",
  upstream_error: "Something went wrong reaching Groq — try again.",
  network_error: "Couldn't reach the server — check your connection and try again.",
  cancelled: "Stopped.",
};

export default function IdeaBuilder() {
  const [fields, setFields] = useState<IdeaFields>(EMPTY);
  const [invalid, setInvalid] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [finalText, setFinalText] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ msg: string; kind: "" | "running" | "error" }>({
    msg: "",
    kind: "",
  });
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      // Restore after mount (not in the initializer) so server and client render match.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setFields((prev) => ({ ...prev, ...JSON.parse(raw) }));
    } catch {
      /* ignore */
    }
  }, []);

  function update(key: keyof IdeaFields, value: string) {
    const next = { ...fields, [key]: value };
    setFields(next);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  function loadSample() {
    setFields(SAMPLE);
    setInvalid(new Set());
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(SAMPLE));
    } catch {
      /* ignore */
    }
  }

  function clearAll() {
    setFields(EMPTY);
    setInvalid(new Set());
    try {
      localStorage.removeItem(STORE_KEY);
    } catch {
      /* ignore */
    }
  }

  function validate(): boolean {
    const missing = new Set<string>();
    for (const key of REQUIRED_FIELDS) {
      if (!fields[key]?.trim()) missing.add(key);
    }
    setInvalid(missing);
    if (missing.size) setStatus({ msg: ERROR_MESSAGES.missing_fields, kind: "error" });
    return missing.size === 0;
  }

  async function run() {
    if (!validate()) return;

    const controller = new AbortController();
    controllerRef.current = controller;
    setRunning(true);
    setFinalText(null);
    setSavedId(null);
    setTruncated(false);
    setStreamText("");
    setStatus({ msg: "Thinking…", kind: "running" });

    let accumulated = "";
    let errored = false;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        let message = ERROR_MESSAGES.upstream_error;
        try {
          const errJson = await res.json();
          message = errJson.message || message;
        } catch {
          /* keep defaults */
        }
        setStatus({ msg: message, kind: "error" });
        setRunning(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split("\n\n");
          buffer = blocks.pop() || "";
          for (const block of blocks) {
            const eventMatch = block.match(/^event:\s*(.+)$/m);
            const dataMatch = block.match(/^data:\s*(.+)$/m);
            if (!eventMatch || !dataMatch) continue;
            const event = eventMatch[1].trim();
            let data: Record<string, unknown> = {};
            try {
              data = JSON.parse(dataMatch[1]);
            } catch {
              continue;
            }
            if (event === "delta" && typeof data.delta === "string") {
              accumulated += data.delta;
              setStreamText(accumulated);
              setStatus({ msg: "Writing…", kind: "running" });
            } else if (event === "done") {
              setSavedId((data.id as string) || null);
              setTruncated(Boolean(data.truncated));
              setStatus({ msg: "Done.", kind: "" });
            } else if (event === "error") {
              const message = (data.message as string) || ERROR_MESSAGES.upstream_error;
              errored = true;
              setStatus({ msg: message, kind: "error" });
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setStatus({ msg: ERROR_MESSAGES.cancelled, kind: "" });
      } else {
        errored = true;
        setStatus({ msg: ERROR_MESSAGES.network_error, kind: "error" });
      }
    } finally {
      if (accumulated && !errored) setFinalText(accumulated);
      setRunning(false);
      controllerRef.current = null;
    }
  }

  function stop() {
    controllerRef.current?.abort();
  }

  function downloadMarkdown() {
    if (!finalText) return;
    const name = appNameFrom(finalText);
    const blob = new Blob([finalText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(name)}-launch-plan.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const displayText = finalText ?? streamText;
  const badge = finalText ? recommendationBadge(finalText) : null;

  return (
    <div className="grid">
      <section className="panel" aria-label="Idea form">
        <h2>1 · Your idea</h2>
        <p className="panel-desc">Five required, three optional. This is all any agent sees.</p>

        <div className="field-row">
          <div className={`field${invalid.has("idea") ? " invalid" : ""}`}>
            <label className="req" htmlFor="idea">
              App idea
            </label>
            <textarea
              id="idea"
              rows={2}
              value={fields.idea}
              onChange={(e) => update("idea", e.target.value)}
              placeholder="e.g. Type a destination, dates, and vibe → get a day-by-day itinerary you can edit and share"
            />
          </div>
          <div className={`field${invalid.has("problem") ? " invalid" : ""}`}>
            <label className="req" htmlFor="problem">
              What problem does it solve
            </label>
            <textarea
              id="problem"
              rows={2}
              value={fields.problem}
              onChange={(e) => update("problem", e.target.value)}
              placeholder="e.g. Trip planning is scattered across 30 browser tabs with no single plan"
            />
          </div>
          <div className={`field${invalid.has("user") ? " invalid" : ""}`}>
            <label className="req" htmlFor="user">
              Target user
            </label>
            <input
              id="user"
              type="text"
              value={fields.user}
              onChange={(e) => update("user", e.target.value)}
              placeholder="e.g. Solo and couple travelers, 25–40"
            />
          </div>
          <div className={`field${invalid.has("goal") ? " invalid" : ""}`}>
            <label className="req" htmlFor="goal">
              Main goal
            </label>
            <input
              id="goal"
              type="text"
              value={fields.goal}
              onChange={(e) => update("goal", e.target.value)}
              placeholder="e.g. Get people from idea to a shareable itinerary in one sitting"
            />
          </div>
          <div className="field">
            <label htmlFor="platform">Platform</label>
            <select
              id="platform"
              value={fields.platform}
              onChange={(e) => update("platform", e.target.value)}
            >
              <option>iOS</option>
              <option>Android</option>
              <option>Web</option>
              <option>iOS + Android</option>
              <option>iOS + Web</option>
              <option>iOS + Android + Web</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="features">
              <span className="optional-tag">Optional ·</span> Existing features
            </label>
            <input
              id="features"
              type="text"
              value={fields.features}
              onChange={(e) => update("features", e.target.value)}
              placeholder="Leave blank if this is a new build"
            />
          </div>
          <div className="field">
            <label htmlFor="competitors">
              <span className="optional-tag">Optional ·</span> Competitors
            </label>
            <input
              id="competitors"
              type="text"
              value={fields.competitors}
              onChange={(e) => update("competitors", e.target.value)}
              placeholder="e.g. TripIt, Wanderlog"
            />
          </div>
          <div className="field">
            <label htmlFor="budget">
              <span className="optional-tag">Optional ·</span> Budget / resources
            </label>
            <input
              id="budget"
              type="text"
              value={fields.budget}
              onChange={(e) => update("budget", e.target.value)}
              placeholder="e.g. Solo builder, nights and weekends"
            />
          </div>
        </div>

        <div className="btn-row">
          <button className="btn primary" type="button" disabled={running} onClick={() => run()}>
            {running ? "Building…" : "Build my launch plan →"}
          </button>
          {running && (
            <button className="btn" type="button" onClick={stop}>
              Stop
            </button>
          )}
          <button className="btn" type="button" onClick={loadSample} disabled={running}>
            Load example
          </button>
          <button className="btn" type="button" onClick={clearAll} disabled={running}>
            Clear
          </button>
        </div>
        <div className={`status-line${status.kind === "error" ? " error" : ""}`} aria-live="polite">
          {status.kind === "running" && <span className="dot" />}
          {status.msg || " "}
        </div>
        <p style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>
          Fields save in this browser only. Submitting sends your idea to Groq via this
          app&apos;s server, and the resulting plan is saved to this app&apos;s history.
        </p>
      </section>

      <section className="panel" aria-label="Launch plan output">
        <h2>2 · Launch plan</h2>
        {!displayText && (
          <div className="results-empty">
            Your Final App Launch Plan will appear here — pitch, features, flow, AI features,
            pricing, growth plan, risks, and the BUILD / CHANGE / VALIDATE FIRST call.
          </div>
        )}
        {displayText && (
          <>
            {badge && <div className={`badge ${badge.cls}`}>{badge.label}</div>}
            <div className="plan" dangerouslySetInnerHTML={{ __html: renderMarkdownLite(displayText) }} />
            {truncated && (
              <div className="truncated-note">
                Cut short by length — press Regenerate, or trim a field and try again.
              </div>
            )}
            {finalText && !running && (
              <div className="btn-row" style={{ marginTop: 14 }}>
                <button className="btn primary" type="button" onClick={downloadMarkdown}>
                  Download as Markdown
                </button>
                <button className="btn" type="button" onClick={() => run()}>
                  Regenerate
                </button>
                {savedId && (
                  <Link className="btn" href={`/history/${savedId}`}>
                    View in history
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
