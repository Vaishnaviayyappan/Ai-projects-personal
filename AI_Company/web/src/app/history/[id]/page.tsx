import { notFound } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import CopyButton from "@/components/CopyButton";
import { getRun } from "@/lib/db";
import { renderMarkdownLite, recommendationBadge } from "@/lib/markdown";

export const dynamic = "force-dynamic";

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const run = getRun(id);
  if (!run) notFound();

  const badge = recommendationBadge(run.output);

  return (
    <>
      <SiteNav />
      <main>
        <div className="wrap page">
          <header className="hero">
            <div className="eyebrow">{new Date(run.created_at).toLocaleString()}</div>
            <h1>{run.app_name || "Untitled idea"}</h1>
            <p className="sub">{run.idea}</p>
          </header>

          <section className="panel">
            {badge && <div className={`badge ${badge.cls}`}>{badge.label}</div>}
            <div
              className="plan"
              dangerouslySetInnerHTML={{ __html: renderMarkdownLite(run.output) }}
            />
            {run.truncated === 1 && (
              <div className="truncated-note">This answer was cut short by length.</div>
            )}
            <div className="btn-row" style={{ marginTop: 14 }}>
              <CopyButton text={run.output} label="Copy plan as Markdown" />
            </div>
          </section>

          <footer className="site-footer">
            Adapted from the Claude App Company OS setup guide by @seb.ai, powered by Groq
          </footer>
        </div>
      </main>
    </>
  );
}
