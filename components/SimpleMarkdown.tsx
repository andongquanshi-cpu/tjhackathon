import type { ReactNode } from "react";

/** 轻量 Markdown 渲染：支持 ## / ### / - 列表 / **粗体** / 空行分段 */
export default function SimpleMarkdown({ source }: { source: string }) {
  const blocks = source.trim().split(/\n{2,}/);

  return (
    <div className="simple-md">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const first = lines[0]?.trim() ?? "";

        if (first.startsWith("## ")) {
          return (
            <section key={i} className="simple-md__section">
              <h2>{inline(first.slice(3))}</h2>
              {lines.slice(1).filter(Boolean).map((line, j) => renderLine(line, `${i}-${j}`))}
            </section>
          );
        }

        if (first.startsWith("### ")) {
          return (
            <section key={i} className="simple-md__sub">
              <h3>{inline(first.slice(4))}</h3>
              {lines.slice(1).filter(Boolean).map((line, j) => renderLine(line, `${i}-${j}`))}
            </section>
          );
        }

        if (lines.every((l) => /^\s*[-*]\s+/.test(l) || !l.trim())) {
          return (
            <ul key={i} className="simple-md__list">
              {lines
                .filter((l) => l.trim())
                .map((l, j) => (
                  <li key={j}>{inline(l.replace(/^\s*[-*]\s+/, ""))}</li>
                ))}
            </ul>
          );
        }

        return (
          <p key={i} className="simple-md__p">
            {lines.map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {inline(line)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function renderLine(line: string, key: string) {
  const t = line.trim();
  if (/^[-*]\s+/.test(t)) {
    return (
      <p key={key} className="simple-md__li">
        · {inline(t.replace(/^[-*]\s+/, ""))}
      </p>
    );
  }
  if (t.startsWith("### ")) {
    return (
      <h3 key={key} className="simple-md__h3-inline">
        {inline(t.slice(4))}
      </h3>
    );
  }
  return (
    <p key={key} className="simple-md__p">
      {inline(t)}
    </p>
  );
}

function inline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}
