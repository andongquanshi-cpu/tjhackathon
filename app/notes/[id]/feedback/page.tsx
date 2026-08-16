import Link from "next/link";
import { notFound } from "next/navigation";
import XiaoyuAvatar from "@/components/XiaoyuAvatar";
import { getNote } from "@/lib/store";

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const note = getNote(id);
  if (!note) notFound();

  if (!note.feedback) {
    return (
      <main className="feedback-shell">
        <XiaoyuAvatar variant="host" size="lg" />
        <h1>这份反馈还在整理中</h1>
        <p>回到圆桌完成讨论后，小愈会把本轮值得带走的内容放在这里。</p>
        <Link href={`/notes/${id}`} className="primary-pill">返回圆桌 →</Link>
      </main>
    );
  }

  return (
    <main className="feedback-page min-h-screen">
      <header>
        <Link href="/journal">← 回到主界面</Link>
        <span>DAY {note.day} · 圆桌反馈</span>
      </header>

      <section className="feedback-layout">
        <aside>
          <XiaoyuAvatar variant="host" size="lg" />
          <span className="eyebrow">XIAOYU&apos;S NOTE</span>
          <h1>把今天的这一页，轻轻收好。</h1>
        </aside>
        <article className="feedback-paper">
          <div>
            <span className="eyebrow">本轮回望</span>
            <p className="feedback-summary">{note.feedback.summary}</p>
          </div>
          <div>
            <span className="eyebrow">你已经看见</span>
            <ol>
              {note.feedback.highlights.map((item, index) => (
                <li key={item}><b>0{index + 1}</b><span>{item}</span></li>
              ))}
            </ol>
          </div>
          <div className="next-action">
            <span className="eyebrow">接下来的一小步</span>
            <p>{note.feedback.suggestedAction}</p>
          </div>
          <div className="feedback-actions">
            <Link href={`/notes/${id}`}>回看本次对话</Link>
            <Link href="/journal" className="primary-pill">完成，返回主界面 →</Link>
          </div>
        </article>
      </section>
    </main>
  );
}
