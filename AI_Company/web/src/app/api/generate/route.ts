import { NextRequest } from "next/server";
import { buildFullPrompt, validateFields, type IdeaFields } from "@/lib/prompt";
import { appNameFrom, recommendationBadge } from "@/lib/markdown";
import { saveRun } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 120;

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

interface GroqChunk {
  choices?: { delta?: { content?: string }; finish_reason?: string | null }[];
  error?: { message?: string };
}

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error: "missing_api_key",
        message:
          "GROQ_API_KEY isn't set on the server. Get a free key at console.groq.com, add it to .env.local, and restart the dev server.",
      },
      { status: 500 }
    );
  }

  let fields: Partial<IdeaFields>;
  try {
    fields = (await req.json()) as Partial<IdeaFields>;
  } catch {
    return Response.json(
      { error: "bad_request", message: "Malformed request body." },
      { status: 400 }
    );
  }

  const missing = validateFields(fields);
  if (missing.length) {
    return Response.json(
      { error: "missing_fields", message: `Missing required fields: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  const idea: IdeaFields = {
    idea: fields.idea || "",
    problem: fields.problem || "",
    user: fields.user || "",
    goal: fields.goal || "",
    platform: fields.platform || "iOS / Android / Web",
    features: fields.features,
    competitors: fields.competitors,
    budget: fields.budget,
  };

  const prompt = buildFullPrompt(idea);
  const encoder = new TextEncoder();

  const groqAbort = new AbortController();
  let clientGone = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(sse(event, data)));

      try {
        const groqRes = await fetch(GROQ_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          signal: groqAbort.signal,
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [{ role: "user", content: prompt }],
            stream: true,
            max_tokens: 4096,
            temperature: 0.7,
          }),
        });

        if (!groqRes.ok || !groqRes.body) {
          const text = await groqRes.text().catch(() => "");
          send("error", {
            code: "upstream_error",
            message: `Groq request failed (${groqRes.status}). ${text}`.trim(),
          });
          controller.close();
          return;
        }

        const reader = groqRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";
        let finishReason = "stop";
        let streamDone = false;

        while (!streamDone) {
          const { value, done: readerDone } = await reader.read();
          streamDone = readerDone;
          if (value) {
            buffer += decoder.decode(value, { stream: true });
            const blocks = buffer.split("\n\n");
            buffer = blocks.pop() || "";
            for (const block of blocks) {
              const dataLine = block
                .split("\n")
                .find((l) => l.startsWith("data:"));
              if (!dataLine) continue;
              const payload = dataLine.slice(5).trim();
              if (payload === "[DONE]") continue;
              let chunk: GroqChunk;
              try {
                chunk = JSON.parse(payload);
              } catch {
                continue;
              }
              if (chunk.error) {
                send("error", { code: "upstream_error", message: chunk.error.message || "Groq error." });
                controller.close();
                return;
              }
              const choice = chunk.choices?.[0];
              const delta = choice?.delta?.content;
              if (delta) {
                fullText += delta;
                send("delta", { delta });
              }
              if (choice?.finish_reason) {
                finishReason = choice.finish_reason;
              }
            }
          }
        }

        if (!fullText.trim()) {
          send("error", { code: "empty_completion", message: "No answer came back. Try again." });
          controller.close();
          return;
        }

        const truncated = finishReason === "length";
        const appName = appNameFrom(fullText);
        const rec = recommendationBadge(fullText);

        const id = saveRun({
          fields: idea,
          output: fullText,
          truncated,
          appName,
          recommendation: rec ? rec.label : null,
        });

        send("done", { id, truncated, appName, recommendation: rec });
        controller.close();
      } catch (err) {
        if (clientGone) return; // aborted because the client disconnected — nothing to report to
        const message =
          err instanceof Error ? err.message : "Something went wrong reaching Groq.";
        send("error", { code: "upstream_error", message });
        controller.close();
      }
    },
    cancel(reason) {
      clientGone = true;
      groqAbort.abort(reason);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
