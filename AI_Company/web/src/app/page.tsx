import SiteNav from "@/components/SiteNav";
import IdeaBuilder from "@/components/IdeaBuilder";
import AgentGrid from "@/components/AgentGrid";

export default function Home() {
  return (
    <>
      <SiteNav />
      <main>
        <div className="wrap page">
          <header className="hero">
            <div className="eyebrow">App Company OS · powered by Groq</div>
            <h1>App Company OS</h1>
            <p className="sub">
              Submit one app idea. Six agent perspectives — Customer, Product, UX, AI Strategy,
              Monetization, Growth — build on each other and hand back a Final App Launch Plan,
              ending in a BUILD / CHANGE / VALIDATE FIRST call. You still make the actual
              decision.
            </p>
            <div className="flow">
              <b>IDEA</b>
              <span className="arrow">→</span>
              <b>CUSTOMER</b>
              <span className="arrow">→</span>
              <b>PRODUCT</b>
              <span className="arrow">→</span>
              <b>UX</b>
              <span className="arrow">→</span>
              <b>AI</b>
              <span className="arrow">→</span>
              <b>MONETIZATION</b>
              <span className="arrow">→</span>
              <b>GROWTH</b>
              <span className="arrow">→</span>
              <b>6-AGENT REVIEW</b>
              <span className="arrow">→</span>
              <b>LAUNCH PLAN</b>
              <span className="arrow">→</span>
              <b>YOUR DECISION</b>
            </div>
            <div className="disclaimer">
              &quot;$100M&quot; is branding, not a valuation or a promised result. The six agents
              are inspired by publicly available ideas and frameworks associated with the people
              referenced — not affiliated with, endorsed by, or trained by them, and they never
              speak as or quote them. Treat every number in the plan as{" "}
              <code>DATA NOT PROVIDED</code>, a fact you supplied, or{" "}
              <code>[TO BE MEASURED]</code> — validate with real users before building.
            </div>
          </header>

          <IdeaBuilder />
          <AgentGrid />

          <footer className="site-footer">
            Adapted from the Claude App Company OS setup guide by @seb.ai, running here on an
            open-source model via Groq — inspired by publicly available frameworks, not
            affiliated with or endorsed by the people referenced.
          </footer>
        </div>
      </main>
    </>
  );
}
