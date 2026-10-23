import { AGENTS, agentPrompt } from "@/lib/prompt";
import CopyButton from "./CopyButton";

export default function AgentGrid() {
  return (
    <section aria-label="The six agents">
      <div className="agents-head">
        <h2>Meet the six agents</h2>
        <p className="panel-desc">
          Each one also runs standalone for depth — expand a card for its copy/paste prompt to
          run in any chat with a capable model, with the Master Input plus whatever prior agent
          output is relevant as its CONTEXT.
        </p>
      </div>
      <div className="agent-grid">
        {AGENTS.map((a) => (
          <div className="agent-card" key={a.key}>
            <div className="num">AGENT {a.num}</div>
            <h3>{a.title}</h3>
            <div className="persona">{a.persona}</div>
            <p>{a.blurb}</p>
            <div className="out">Outputs: {a.out}</div>
            <details className="agent-prompt">
              <summary>Standalone prompt</summary>
              <pre>{agentPrompt(a)}</pre>
              <div className="copyline">
                <CopyButton text={agentPrompt(a)} label="Copy agent prompt" />
              </div>
            </details>
          </div>
        ))}
      </div>
    </section>
  );
}
