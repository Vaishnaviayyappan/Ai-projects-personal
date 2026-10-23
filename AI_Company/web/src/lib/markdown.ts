/**
 * Minimal markdown-to-HTML renderer for model output. Escapes HTML first so
 * anything echoed back from user input can never inject tags — only the
 * literal ##, **, *, `, -, and numbered-list syntax we ask the model for
 * is converted.
 */
export function renderMarkdownLite(raw: string): string {
  const escaped = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const lines = escaped.split("\n");
  let html = "";
  let inList: "ul" | "ol" | false = false;

  const closeList = () => {
    if (inList) {
      html += inList === "ul" ? "</ul>" : "</ol>";
      inList = false;
    }
  };

  const inline = (s: string): string => {
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    return s;
  };

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.*)/);
    const h3 = line.match(/^###\s+(.*)/);
    const bullet = line.match(/^[-*]\s+(.*)/);
    const num = line.match(/^\d+\.\s+(.*)/);

    if (h2) {
      closeList();
      html += `<h3 class="stepHead">${inline(h2[1])}</h3>`;
    } else if (h3) {
      closeList();
      html += `<h4>${inline(h3[1])}</h4>`;
    } else if (bullet) {
      if (inList !== "ul") {
        closeList();
        html += "<ul>";
        inList = "ul";
      }
      html += `<li>${inline(bullet[1])}</li>`;
    } else if (num) {
      if (inList !== "ol") {
        closeList();
        html += "<ol>";
        inList = "ol";
      }
      html += `<li>${inline(num[1])}</li>`;
    } else if (line.trim() === "") {
      closeList();
    } else {
      closeList();
      html += `<p>${inline(line)}</p>`;
    }
  }
  closeList();
  return html;
}

export interface Recommendation {
  cls: "build" | "change" | "validate";
  label: string;
}

export function recommendationBadge(raw: string): Recommendation | null {
  const idx = raw.search(/build\s*\/\s*change\s*\/\s*validate first/i);
  if (idx === -1) return null;
  const tail = raw.slice(idx + 40, idx + 400);
  const m = tail.match(/build|change|validate first/i);
  if (!m) return null;
  const word = m[0].toUpperCase();
  if (word === "BUILD") return { cls: "build", label: "Recommendation: BUILD" };
  if (word === "CHANGE") return { cls: "change", label: "Recommendation: CHANGE" };
  return { cls: "validate", label: "Recommendation: VALIDATE FIRST" };
}

export function appNameFrom(raw: string): string {
  const m = raw.match(/app name[:\-]?\**\s*\**\s*(.+)/i);
  const name = m ? m[1].split("\n")[0].replace(/[*_]/g, "").trim() : "";
  return name || "Untitled idea";
}

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "launch-plan"
  );
}
