import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import { listRuns } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function HistoryPage() {
  const runs = listRuns();

  return (
    <>
      <SiteNav />
      <main>
        <div className="wrap page">
          <header className="hero">
            <div className="eyebrow">History</div>
            <h1>Past launch plans</h1>
            <p className="sub">
              Every idea run through the six agents, saved here. Newest first.
            </p>
          </header>

          {runs.length === 0 ? (
            <div className="results-empty">
              Nothing here yet. <Link href="/">Build your first launch plan →</Link>
            </div>
          ) : (
            <div className="history-list">
              {runs.map((r) => (
                <Link className="history-card" href={`/history/${r.id}`} key={r.id}>
                  <div className="title-row">
                    <h3>{r.app_name || "Untitled idea"}</h3>
                    {r.recommendation && (
                      <span
                        className={`badge ${
                          /build/i.test(r.recommendation)
                            ? "build"
                            : /change/i.test(r.recommendation)
                              ? "change"
                              : "validate"
                        }`}
                      >
                        {r.recommendation.replace("Recommendation: ", "")}
                      </span>
                    )}
                  </div>
                  <div className="meta">
                    {new Date(r.created_at).toLocaleString()} · {r.platform}
                  </div>
                  <div className="idea-line">{r.idea}</div>
                </Link>
              ))}
            </div>
          )}

          <footer className="site-footer">
            Adapted from the Claude App Company OS setup guide by @seb.ai, powered by Groq
          </footer>
        </div>
      </main>
    </>
  );
}
